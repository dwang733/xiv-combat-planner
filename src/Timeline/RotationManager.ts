import moment from 'moment';
import { DataSet } from 'vis-data/peer';
import { DateType } from 'vis-timeline/peer';

import { ActionItem } from '../actionTypes';

const ANIMATION_LOCK_IN_MS = 500;

export default class RotationManager {
  // Snap points for actions items in ms
  private snapPoints: number[] = [];
  private actionItemsArray: ActionItem[] = [];

  public actionItemsDataSet = new DataSet<ActionItem>();

  /**
   * Adds actions to the action items.
   * @param actions An action or array of actions to add.
   * @param cursorTime The time where the cursor is at.
   */
  addActions(actions: ActionItem | ActionItem[], cursorTime: DateType) {
    this.recalculateRotation(actions, 'add', cursorTime);
  }

  /**
   * Removes actions from the action items.
   * @param actions An action or array of actions to remove.
   */
  removeActions(actions: ActionItem | ActionItem[]) {
    this.recalculateRotation(actions, 'remove');
  }

  /**
   * Moves actions in the action items.
   * @param actions An action or array of actions to move.
   * @param cursorTime The time where the cursor is at.
   */
  moveActions(actions: ActionItem | ActionItem[], cursorTime: DateType) {
    this.recalculateRotation(actions, 'move', cursorTime);
  }

  /**
   * Gets the closest snap point of an action to the given time.
   * @param time The time to find the closest snap point to.
   * @returns The time of the closest snap point.
   */
  getClosestSnapPoint(time: DateType): DateType {
    if (this.snapPoints.length === 0) {
      return 0;
    }

    const itemStartInMs = moment(time).valueOf();
    // Store reduce state as (snap point, abs diff to time)
    const [closestTime] = this.snapPoints.reduce<number[]>(
      (prev, curr) => {
        const diff = Math.abs(curr - itemStartInMs);
        return diff < prev[1] ? [curr, diff] : prev;
      },
      [Infinity, Infinity]
    );
    return closestTime;
  }

  private recalculateRotation(
    actions: ActionItem | ActionItem[],
    type: 'add' | 'remove' | 'move',
    cursorTime?: DateType
  ) {
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    actionsArray.sort((a, b) => moment(a.start).valueOf() - moment(b.start).valueOf());

    let removeIndex: number = Infinity;
    if (type === 'remove' || type === 'move') {
      const actionIds = actionsArray.map((a) => a.id);
      removeIndex = this.actionItemsArray.findIndex(
        (a) => moment(a.start).valueOf() >= moment(actionsArray[0].start).valueOf()
      );

      this.actionItemsArray = this.actionItemsArray.filter((a) => !actionIds.includes(a.id));
      this.actionItemsDataSet.remove(actionIds);
    }

    let addIndex: number = Infinity;
    if (type === 'add' || type === 'move') {
      if (cursorTime === undefined) {
        throw new Error('cursorTime must be defined when adding or moving items in rotation');
      }

      const snapPoint = this.getClosestSnapPoint(cursorTime);
      addIndex = this.actionItemsArray.findIndex(
        (a) => moment(a.start).valueOf() >= moment(snapPoint).valueOf()
      );

      if (addIndex === -1) {
        // Add actions at end of action items array
        addIndex = this.actionItemsArray.length;
        this.actionItemsArray = [...this.actionItemsArray, ...actionsArray];
      } else {
        const beforeSnapPointArray = this.actionItemsArray.splice(0, addIndex);
        this.actionItemsArray = [
          ...beforeSnapPointArray,
          ...actionsArray,
          ...this.actionItemsArray,
        ];
      }

      this.actionItemsDataSet.add(actions);
    }

    // Recalculate start time for affected actions
    for (let i = Math.min(addIndex, removeIndex); i < this.actionItemsArray.length; i += 1) {
      const currItem = this.actionItemsArray[i];

      if (i === 0) {
        currItem.start = 0;
      } else {
        const prevItem = this.actionItemsArray[i - 1];
        // TODO: Handle oGCDs
        currItem.start = moment(prevItem.start).valueOf() + prevItem.nextGCD * 1000;
      }

      this.actionItemsDataSet.updateOnly(currItem);
    }

    this.recalculateSnapPoints();
  }

  private recalculateSnapPoints() {
    const newSnapPoints = this.actionItemsArray.flatMap((item) => {
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
    this.snapPoints = [...new Set(newSnapPoints)];
  }
}
