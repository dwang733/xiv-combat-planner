import { GCD, Job } from '../actionTypes';

const name = 'Summoner';
const abbr = 'SMN';

const baseActions: Omit<GCD, 'job'>[] = [
  {
    name: 'Summon Bahamut',
    potency: 0,
    castTime: 0,
    nextGCD: 2.5,
    cooldown: 60,
    mpCost: 0,
  },
];
const actions: GCD[] = baseActions.map((a) => ({ ...a, job: name }));

export default class Summoner implements Job {
  name = name;
  abbr = abbr;
  actions = actions;
}
