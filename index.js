import { Module } from '@ruinguard/core';
import { getDir } from 'file-ez';

const module = await new Module({
  commands: getDir('./commands').path,
  events: getDir('./events').path,
  intents: [1<<0, 1<<1, 1<<9],
});

export default (options = {}) => {
  if (options.enable) module.commands = module.commands.filter(c => options.enable.includes(c.name));
  if (options.disable) module.commands = module.commands.filter(c => !options.disable.includes(c.name));

  if (options.enable) module.events = module.events.filter(e => options.enable.includes(e.name));
  if (options.disable) module.events = module.events.filter(e => !options.disable.includes(e.name));

  return module;
};