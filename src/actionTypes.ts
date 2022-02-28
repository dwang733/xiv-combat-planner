/**
 * Implements a GCD action.
 */
export class GCD {
  /** The name of the action. */
  name: string = '';
  /** The base damage of the action. */
  potency: number = 0;
  /** How long to execute an action, in seconds. */
  castTime: number = 0;
  /** How long before next GCD can be casted, in seconds. */
  nextGCD: number = 2.5;
  /** How long before action can be executed again, in seconds. */
  cooldown: number = 2.5;
  /** The amount of MP it costs to use the action. */
  mpCost: number = 0;
  /** The function that runs after the action is executed. */
  onEffect: Function | null = null;

  constructor(options: GCDOptions) {
    Object.assign(this, options);
  }
}

// Require name and potency when initializing GCD.
export type GCDOptions = Partial<GCD> & Pick<GCD, 'name' | 'potency'>;
