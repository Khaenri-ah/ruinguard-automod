import { Command } from '@ruinguard/core';
import ms from 'ms';

export default new Command({
  data: {
    name: 'filter',
    description: 'settings for the word filter',
    options: [
      {
        type: 1,
        name: 'add',
        description: 'add words to the filter',
        options: [
          {
            type: 3,
            name: 'words',
            description: 'words can contain A-z, 0-9, and _',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'remove',
        description: 'remove words from the filter',
        options: [
          {
            type: 3,
            name: 'words',
            description: 'words can contain A-z, 0-9, and _',
            required: true,
          },
        ],
      },
      {
        type: 1,
        name: 'list',
        description: 'list all the words in the filter',
        options: [
          {
            type: 4,
            name: 'page',
            description: 'the page of words you want to view',
            min_value: 1, // eslint-disable-line camelcase
          },
        ],
      },
      {
        type: 1,
        name: 'punishment',
        description: 'what needs to happen with people who say a filtered word',
        options: [
          {
            type: 3,
            name: 'type',
            description: 'the punishment you want to give for saying a filtered word',
            choices: [
              {
                name: 'delete',
                value: '0',
              },
              {
                name: 'mute',
                value: '1',
              },
              {
                name: 'kick',
                value: '2',
              },
              {
                name: 'ban',
                value: '3',
              },
            ],
            required: true,
          },
          {
            type: 3,
            name: 'duration',
            description: 'how long to mute someone for, if set to mute, max. 4 weeks, default: 1 minute',
          },
        ],
      },
    ],
  },
  permissions: {
    self: [1<<1, 1<<2, 1<<13, 1<<40],
    user: [1<<1, 1<<2, 1<<13, 1<<40],
  },

  async run(interaction) {
    switch (interaction.options.getSubcommand()) {
    case 'add': return add(interaction);
    case 'remove': return remove(interaction);
    case 'list': return list(interaction);
    case 'punishment': return punishment(interaction);
    }
  },
});


async function add(interaction) {
  const settings = await interaction.client.db.get(`${interaction.guild.id}.filter`) || { punishment: 0 };
  settings.words = [...new Set((settings.words || []).concat(interaction.options.getString('words').split(/\W+/)))].filter(w => w).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  await interaction.client.db.set(`${interaction.guild.id}.filter`, settings);
  await interaction.reply({
    content: 'list updated',
    ephemeral: true,
  });
}

async function remove(interaction) {
  const settings = await interaction.client.db.get(`${interaction.guild.id}.filter`);
  if (!settings) {
    return interaction.reply({
      content: 'You don\'t have the filter active',
      ephemeral: true,
    });
  }
  const words = interaction.options.getString('words').split(/\W+/);
  settings.words = settings.words.filter(word => !words.includes(word));
  await interaction.client.db.set(`${interaction.guild.id}.filter`, settings);
  await interaction.reply({
    content: 'list updated',
    ephemeral: true,
  });
}

async function list(interaction) {
  const settings = await interaction.client.db.get(`${interaction.guild.id}.filter`);
  if (!settings) {
    return interaction.reply({
      content: 'You don\'t have the filter active',
      ephemeral: true,
    });
  }
  const pages = splitArray(settings.words, 15*9);
  const page = interaction.options.getInteger('page', false) || 1;
  if (!pages[page-1]) {
    return interaction.reply({
      content: 'that page has no words',
      ephemeral: true,
    });
  }
  return interaction.reply({
    embeds: [{ fields: splitArray(pages[page-1], 15).map(words => ({ name: `**${words[0][0].toUpperCase()}-${words.at(-1)[0].toUpperCase()}**`, value: words.join('\n'), inline: true })), footer: { text: `page ${page}/${pages.length}` } }],
    ephemeral: true,
  });
}

async function punishment(interaction) {
  const settings = await interaction.client.db.get(`${interaction.guild.id}.filter`) || { words: [], duration: 60_000 };
  settings.punishment = parseInt(interaction.options.getString('type'));
  settings.duration = ms(interaction.options.getString('duration', false)) || settings.duration;
  await interaction.client.db.set(`${interaction.guild.id}.filter`, settings);
  await interaction.reply({
    content: 'settings updated',
    ephemeral: true,
  });
}


function splitArray(array, chunkSize) {
  return Array(Math.ceil(array.length/chunkSize)).fill(0).map((_, i) => array.slice(i*chunkSize, (i+1)*chunkSize));
}