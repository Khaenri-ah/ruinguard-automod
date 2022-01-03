import { Event, RatelimitManager } from '@ruinguard/core';

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
        raid: false,
      };
    },
  }),

  new Event({
    name: 'antiraid',
    event: 'guildMemberAdd',
    async run(member) {
      // only new users
      if (Date.now() - member.user.createdTimestamp > 7 * 24 * 3_600_000) return;
      const antiraid = member.client.antiraid;

      // raid in progress
      if (Date.now() - antiraid.raid <= 30_000) {
        antiraid.raid = Date.now();
        antiraid.ratelimits.call(member.guild.id);
        return member.ban({ reason: `raid: ${Date()}` }).catch(() => {});
      }

      const limit = antiraid.ratelimits.call(member.guild.id, { cache: member.id });

      // no raid starting
      if (!limit) {
        antiraid.raid = false;
        return;
      }

      // raid starting
      antiraid.raid = Date.now();
      for (const id of limit.c) {
        await member.guild.members.ban(id, { reason: `raid: ${Date()}` }).catch(() => {});
      }
    },
  }),
];