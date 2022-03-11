import { Action, Job } from '../actionTypes';

const name = 'Summoner';
const abbr = 'SMN';

const baseActions: Omit<Action, 'job'>[] = [
  {
    name: 'Summon Bahamut',
    potency: 0,
    castTime: 0,
    nextGCD: 2.5,
    cooldown: 60,
    mpCost: 0,
  },
  {
    name: 'Test',
    potency: 0,
    castTime: 1.5,
    nextGCD: 2.5,
    cooldown: 60,
    mpCost: 0,
  },
];
const actions: Action[] = baseActions.map((a) => ({ ...a, job: abbr }));

export default class Summoner implements Job {
  name = name;
  abbr = abbr;
  actions = actions;
}
