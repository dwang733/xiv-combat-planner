import moment from 'moment';
import { DateType, TimelineItem } from 'vis-timeline/peer';

import { ActionItem } from '../actionTypes';

const ANIMATION_LOCK_IN_MS = 500;

function actionItemComparer(a: ActionItem, b: ActionItem) {
  return moment(a.start).valueOf() - moment(b.start).valueOf();
}

export default class RotationPlanner {
  // Snap points for actions items in ms
  private snapPoints: number[] = [];

  public actionItems: ActionItem[] = [];

  /**
   * Add actions to the action items.
   * @param actions An array of the actions to add.
   */
  addActions(actions: ActionItem | ActionItem[]) {
    const actionsAsArray = Array.isArray(actions) ? actions : [actions];
    this.actionItems.push(...actionsAsArray);
    this.actionItems.sort(actionItemComparer);
    this.recalculateSnapPoints();
  }

  /**
   * Remove actions from the action items.
   * @param actions An array of the actions to remove.
   */
  removeActions(actions: ActionItem | ActionItem[]) {
    const wrappedActions = Array.isArray(actions) ? actions : [actions];
    const actionsIds = wrappedActions.map((a) => a.id);
    this.actionItems = this.actionItems.filter((a) => actionsIds.includes(a.id));
    this.recalculateSnapPoints();
  }

  /**
   * Move actions in the action items.
   * @param actions An array of the actions to move.
   */
  moveActions(actions: ActionItem[]) {
    const wrappedActions = Array.isArray(actions) ? actions : [actions];

    // Remove actions
    const actionsIds = wrappedActions.map((a) => a.id);
    this.actionItems = this.actionItems.filter((a) => actionsIds.includes(a.id));

    // Add actions
    this.actionItems.push(...wrappedActions);
    this.actionItems.sort(actionItemComparer);

    this.recalculateSnapPoints();
  }

  getClosestSnapPoint(item: TimelineItem): DateType {
    if (this.snapPoints.length === 0) {
      return 0;
    }

    const itemStartInMs = moment(item.start).valueOf();
    const sortedSnapPoints = this.snapPoints.map((p) => p - itemStartInMs);
    sortedSnapPoints.sort();
    return moment(sortedSnapPoints[0]).toISOString();
  }

  private recalculateSnapPoints() {
    this.snapPoints = this.actionItems.flatMap((item) => {
      const itemStartInMs = moment(item.start).valueOf();
      const itemSnapPoints = [itemStartInMs];
      if (item.nextGCD > 0) {
        // Add snap points for GCD
        const itemGCDEndInMs = itemStartInMs + item.nextGCD * 1000;
        itemSnapPoints.push(itemGCDEndInMs);
        if (item.castTime > 0) {
          const itemCastEndInMs = itemStartInMs + item.castTime * 1000;
          itemSnapPoints.push(itemCastEndInMs);
        }
      } else {
        // Add snap points for oGCD
        const itemLockEndInMs = itemStartInMs + ANIMATION_LOCK_IN_MS;
        itemSnapPoints.push(itemLockEndInMs);
      }
      return itemSnapPoints;
    });
  }
}
