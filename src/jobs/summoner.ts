import { GCD } from '../actionTypes';

export default class Summoner {
  summonBahamut = new GCD({
    name: 'Summon Bahamut',
    potency: 0,
    cooldown: 60,
    mpCost: 0,
    onEffect: null,
  });
}
