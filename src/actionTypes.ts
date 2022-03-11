import { TimelineItem } from 'vis-timeline/peer';

/**
 * Implements a action.
 */
export class Action {
  /**
   *
   * @param job The job that uses this action.
   * @param name The name of the action.
   * @param potency The base damage of the action.
   * @param castTime How long to execute an action, in seconds.
   * @param nextGCD How long before next GCD can be casted, in seconds.
   * @param cooldown How long before action can be executed again, in seconds.
   * @param mpCost The amount of MP it costs to use the action
   * @param onEffect The function that runs after the action is executed.
   */
  constructor(
    public job: string,
    public name: string,
    public potency: number,
    public castTime: number,
    public nextGCD: number,
    public cooldown: number,
    public mpCost: number,
    public onEffect?: Function
  ) {}
}

export type ActionItem = TimelineItem & Action;
export type ActionItemPartial = TimelineItem & Partial<Action>;

export interface Job {
  name: string;
  abbr: string;
  actions: Action[];
}
