import moment from 'moment';
import { DataSet } from 'vis-data/peer';
import { DateType } from 'vis-timeline/peer';

import { ActionItem } from '../actionTypes';

const ANIMATION_LOCK_IN_MS = 500;

export default class RotationPlanner {
  // Snap points for actions items in ms
  private snapPoints: number[] = [];
  private actionItemsArray: ActionItem[] = [];

  public actionItemsDataSet = new DataSet<ActionItem>();

  /**
   * Add actions to the action items.
   * @param actions An array of the actions to add.
   * @param cursorTime The time where the cursor is at.
   */
  addActions(actions: ActionItem | ActionItem[], cursorTime: DateType) {
    const addActionsArray = Array.isArray(actions) ? actions : [actions];
    // TODO: Handle whole array start and shift
    const snapPoint = this.getClosestSnapPoint(cursorTime);
    let snapIndex: number | undefined = this.actionItemsArray.findIndex(
      (a) => a.start >= snapPoint
    );
    if (snapIndex === -1) {
      snapIndex = undefined;
    }

    const newActionItemsArray = this.actionItemsArray.slice(0, snapIndex);
    // Add new actions to array
    for (let i = 0; i < addActionsArray.length; i += 1) {
      const prevItem = newActionItemsArray.at(-1);
      // TODO: Handle oGCDs
      addActionsArray[i].start = prevItem
        ? moment(prevItem.start).valueOf() + prevItem.nextGCD * 1000
        : snapPoint;
      newActionItemsArray.push(addActionsArray[i]);
      this.actionItemsDataSet.add(addActionsArray[i]);
    }

    if (snapIndex !== undefined) {
      // Shift existing items after added items
      for (let i = snapIndex; i < this.actionItemsArray.length; i += 1) {
        const prevItem = newActionItemsArray.at(-1)!;
        // TODO: Handle oGCDs
        this.actionItemsArray[i].start = moment(prevItem.start).valueOf() + prevItem.nextGCD * 1000;
        newActionItemsArray.push(this.actionItemsArray[i]);
        this.actionItemsDataSet.updateOnly(this.actionItemsArray[i]);
      }
    }

    this.actionItemsArray = newActionItemsArray;
    this.recalculateSnapPoints();

    console.table(this.actionItemsArray);
  }

  /**
   * Remove actions from the action items.
   * @param actions An array of the actions to remove.
   */
  removeActions(actions: ActionItem | ActionItem[]) {
    const wrappedActions = Array.isArray(actions) ? actions : [actions];
    const actionIds = wrappedActions.map((a) => a.id);
    this.actionItemsArray = this.actionItemsArray.filter((a) => !actionIds.includes(a.id));

    this.actionItemsDataSet.remove(actionIds);

    this.recalculateSnapPoints();
  }

  /**
   * Move actions in the action items.
   * @param actions An array of the actions to move.
   * @param cursorTime The time where the cursor is at.
   */
  moveActions(actions: ActionItem[], cursorTime: DateType) {
    const wrappedActions = Array.isArray(actions) ? actions : [actions];

    // Remove actions
    const actionIds = wrappedActions.map((a) => a.id);
    this.actionItemsArray = this.actionItemsArray.filter((a) => !actionIds.includes(a.id));
    this.actionItemsDataSet.remove(actionIds);

    // Add actions
    this.addActions(actions, cursorTime);
  }

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
