import { GCD, Job } from '../actionTypes';

export default class Summoner implements Job {
  name = 'Summoner';
  abbr = 'SMN';
  actions = [
    new GCD({
      name: 'Summon Bahamut',
      potency: 0,
      cooldown: 60,
      mpCost: 0,
      onEffect: null,
    }),
  ];
}
