import { Action, Job } from '../actionTypes';

const name = 'Summoner';
const abbr = 'SMN';

const actions: Action[] = [
  new Action({
    job: abbr,
    name: 'Summon Bahamut',
    level: 70,
    actionType: 'spell',
    potency: 0,
    castTime: 0,
    damageDelay: 0,
    nextGCD: 2.5 * 1000,
    cooldown: 60 * 1000,
    mpCost: 0,
  }),
  new Action({
    job: abbr,
    name: 'Ruin III',
    level: 54,
    actionType: 'spell',
    potency: 310,
    castTime: 1.5 * 1000,
    damageDelay: 0.8 * 1000,
    nextGCD: 2.5 * 1000,
    cooldown: 2.5 * 1000,
    mpCost: 300,
  }),
  // {
  //   name: 'Fester',
  //   potency: 300,
  //   castTime: 0,
  //   nextGCD: 0,
  //   cooldown: 0,
  //   mpCost: 0,
  // },
];

export default class Summoner implements Job {
  name = name;
  abbr = abbr;
  actions = actions;
}
