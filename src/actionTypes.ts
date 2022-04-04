import moment from 'moment';
import { TimelineItem } from 'vis-timeline/peer';

export type ActionType = 'skill' | 'spell' | 'ability';

export interface ActionProperties {
  /** The job that uses this action. */
  readonly job: string;

  /** The name of the action. */
  readonly name: string;

  /** The level when you get the action. */
  readonly level: number;

  /** The type of the action. */
  readonly actionType: ActionType;

  /** The base potency of the action. */
  readonly potency: number;

  /** How long to execute an action, in milliseconds. */
  readonly castTime: number;

  /** How long before next GCD can be casted, in milliseconds. */
  readonly nextGCD: number;

  /** How long before action can be executed again, in milliseconds. */
  readonly cooldown: number;

  /** How long the delay is between the cast finishing and the damage applying to the boss, in milliseconds. */
  readonly damageDelay: number;

  /** The amount of MP it costs to use the action. */
  readonly mpCost: number;

  /** The function that applies effects before the damage calculation. */
  // eslint-disable-next-line @typescript-eslint/ban-types
  readonly beforeEffects?: Function;

  /** The function that applies effects after the damage calculation. */
  // eslint-disable-next-line @typescript-eslint/ban-types
  readonly afterEffects?: Function;
}

export interface Action extends ActionProperties {}
export class Action {
  constructor(data: ActionProperties) {
    Object.assign(this, data);
  }

  get gcd() {
    return this.actionType === 'skill' || this.actionType === 'spell';
  }
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type UnsafeTimelineItem = TimelineItem;
export type UnsafeActionItem = UnsafeTimelineItem & Action;
export type UnsafeActionItemPartial = UnsafeTimelineItem & Partial<Action>;

/** TimelineItem that ensures start and end times must be in milliseconds */
export type SafeTimelineItem = Omit<UnsafeTimelineItem, 'start' | 'end'> & {
  start: number;
  end: number;
};
export type ActionItem = SafeTimelineItem & Action;
export type ActionItemPartial = SafeTimelineItem & Partial<Action>;

export function convertToSafeActionItem(unsafeItem: UnsafeActionItem | UnsafeActionItemPartial) {
  const unsafeFullItem = unsafeItem as UnsafeActionItem;
  unsafeFullItem.start = moment(unsafeFullItem.start).valueOf();
  unsafeFullItem.end = moment(unsafeFullItem.end).valueOf();

  const actionItem = unsafeFullItem as ActionItem;
  return actionItem;
}

export interface Job {
  name: string;
  abbr: string;
  actions: Action[];
}
