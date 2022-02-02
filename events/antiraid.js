import { Collection, Event, RatelimitManager } from '@ruinguard/core';

export default [
  new Event({
    name: 'antiraid',
    event: 'ready',
    async run(client) {
      client.antiraid = {
        ratelimits: new RatelimitManager({
          duration: 10_000,
          limit: 5,
        }),
        raid: new Collection(),
      };
    },
  }),

  new Event({
    name: 'antiraid',
    event: 'guildMemberAdd',
    async run(member) {
      // if (Date.now() - member.user.createdTimestamp > 7 * 24 * 3_600_000) return;
      const ratelimits = member.client.antiraid.ratelimits;
      const raid = member.client.antiraid.raid.get(member.guild.id);

      // raid in progress
      if (Date.now() - raid <= 10_000) {
        member.client.antiraid.raid.set(member.guild.id, Date.now());
        ratelimits.call(member.guild.id);
        return member.ban({ reason: `raid: ${Date()}` }).catch(() => {});
      }

      const limit = ratelimits.call(member.guild.id, { cache: member.id });

      // no raid starting
      if (!limit) {
        if (raid) member.client.antiraid.raid.set(member.guild.id, false);
        return;
      }

      // raid starting
      member.client.antiraid.raid.set(member.guild.id, Date.now());
      for (const id of limit.c) {
        await member.guild.members.ban(id, { reason: `raid: ${Date()}` }).catch(() => {});
      }
    },
  }),
];