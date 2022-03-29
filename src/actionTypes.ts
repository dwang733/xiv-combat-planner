import { TimelineItem } from 'vis-timeline/peer';

/**
 * Implements a action.
 */
export class Action {
  /**
   *
   * @param job The job that uses this action.
   * @param name The name of the action.
   * @param level The level when you get the action.
   * @param potency The base damage of the action.
   * @param castTime How long to execute an action, in milliseconds.
   * @param nextGCD How long before next GCD can be casted, in milliseconds.
   * @param cooldown How long before action can be executed again, in milliseconds.
   * @param damageDelay How long the delay is between the cast finishing and the damage applying to the boss, in milliseconds.
   * @param mpCost The amount of MP it costs to use the action.
   * @param beforeEffects The function that applies effects before the damage calculation.
   * @param afterEffects The function that applies effects after the damage calculation
   */
  constructor(
    public readonly job: string,
    public readonly name: string,
    public readonly level: number,
    public readonly potency: number,
    public readonly castTime: number,
    public readonly nextGCD: number,
    public readonly cooldown: number,
    public readonly damageDelay: number,
    public readonly mpCost: number,
    public readonly beforeEffects?: Function,
    public readonly afterEffects?: Function
  ) {}
}

export type ActionItem = TimelineItem & Action;
export type ActionItemPartial = TimelineItem & Partial<Action>;

export interface Job {
  name: string;
  abbr: string;
  actions: Action[];
}
