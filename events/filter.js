import { Event } from '@ruinguard/core';

export default [
  new Event({
    name: 'filter',
    event: 'messageCreate',
    run: handler,
  }),

  new Event({
    name: 'filter',
    event: 'messageUpdate',
    run: (_, message) => handler(message),
  }),
];

async function handler(message) {
  const settings = await message.client.db.get(`${message.guild.id}.filter`);
  if (!settings) return;

  const match = matchWords(settings.words, message.content);
  if (match) {
    const reason = `filter: ${match}`;
    await message.delete();
    switch (settings.punishment) {
    case 1: {
      if (message.member.moderatable) {
        await message.member.timeout(settings.duration, reason).catch(() => {});
      }
      break;
    }
    case 2: {
      if (message.member.kickable) {
        await message.member.kick(reason).catch(() => {});
      }
      break;
    }
    case 3: {
      if (message.member.bannable) {
        await message.member.ban({ reason }).catch(() => {});
      }
      break;
    }
    }

    message.client.emit('automod:filter', {
      guild: message.guild,
      offender: message.author,
      punishment: settings.punishment,
      timestamp: Date.now(),
      message, match,
    });
  }
}

const splitRegex = /\W+/;
function matchWords(words, content) {
  for (const word of content.split(splitRegex)) {
    if (words.includes(word)) return word;
  }
  return false;
}