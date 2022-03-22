import moment from 'moment';
import { createNewDataPipeFrom, DataPipe, DataSet } from 'vis-data/peer';
import { DateType, TimelineItem } from 'vis-timeline/peer';

import { ActionItem, ActionItemPartial } from '../actionTypes';

const ANIMATION_LOCK_IN_MS = 500;

function createActionToTimelinePipeline(
  actionItems: DataSet<ActionItem>,
  timelineItems: DataSet<TimelineItem>
) {
  return createNewDataPipeFrom(actionItems)
    .flatMap((gcdItem) => {
      const gcdBackgroundItem: ActionItemPartial = {
        id: `${gcdItem.id}-gcdBackground`,
        content: '',
        start: moment(gcdItem.start).toISOString(),
        end: moment(gcdItem.start).add(gcdItem.nextGCD, 'seconds').toISOString(),
        type: 'background',
      };
      return [gcdItem, gcdBackgroundItem];
    })
    .to(timelineItems);
}

export default class RotationManager {
  // Snap points for actions items in ms
  private snapPoints: number[] = [];
  private actionItemsArray: ActionItem[] = [];
  private actionToTimelinePipeline: DataPipe;

  // Cursor variables
  private readonly CURSOR_ID = 'cursor';
  private cursorItem: TimelineItem | null = null;

  public actionItemsDataSet = new DataSet<ActionItem>();
  public timelineItemsDataSet = new DataSet<TimelineItem>();

  constructor() {
    this.actionToTimelinePipeline = createActionToTimelinePipeline(
      this.actionItemsDataSet,
      this.timelineItemsDataSet
    );
    this.actionToTimelinePipeline.all().start();
  }

  /**
   * Adds actions to the action items.
   * @param actions An action or array of actions to add.
   */
  addActions(actions: ActionItem | ActionItem[]) {
    this.recalculateRotation(actions, 'add');
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
   */
  moveActions(actions: ActionItem | ActionItem[]) {
    this.recalculateRotation(actions, 'move');
  }

  /**
   * Updates the cursor on the timeline, or adds a cursor if it doesn't exist.
   * @param cursorTime The time where the cursor is currently.
   */
  updateCursor(cursorTime: string) {
    this.cursorItem = {
      id: this.CURSOR_ID,
      start: cursorTime,
      end: cursorTime,
      type: 'range',
      className: 'timeline-cursor',
      content: '',
    };

    const snapStart = this.getClosestSnapPoint(this.cursorItem.start);
    this.cursorItem.start = snapStart;
    this.cursorItem.end = snapStart;

    this.timelineItemsDataSet.update(this.cursorItem);
  }

  /**
   * Removes the cursor on the timeline if needed.
   */
  removeCursor() {
    this.cursorItem = null;
    this.timelineItemsDataSet.remove(this.CURSOR_ID);
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

    // Binary search shamelessly copied from https://stackoverflow.com/a/69561088/5090107
    const itemStartInMs = moment(time).valueOf();
    let startIdx = 0;
    let endIdx = this.snapPoints.length - 1;
    let midIdx = Math.floor((startIdx + endIdx) / 2);

    while (startIdx < endIdx) {
      const snapPoint = this.snapPoints[midIdx];
      if (snapPoint === itemStartInMs) {
        return snapPoint;
      }

      if (startIdx >= endIdx) {
        break;
      }

      if (snapPoint > itemStartInMs) {
        endIdx = midIdx - 1;
      } else {
        startIdx = midIdx + 1;
      }

      midIdx = Math.floor((startIdx + endIdx) / 2);
    }

    // Return the closest between the last value checked and its surrounding neighbors
    const firstIdx = Math.max(midIdx - 1, 0);
    const neighbors = this.snapPoints.slice(firstIdx, midIdx + 2);
    const best = neighbors.reduce((b, el) =>
      Math.abs(el - itemStartInMs) < Math.abs(b - itemStartInMs) ? el : b
    );
    return best;
  }

  private recalculateRotation(actions: ActionItem | ActionItem[], type: 'add' | 'remove' | 'move') {
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
      const cursorTime = this.cursorItem!.start;
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

    // Remove duplicates
    this.snapPoints = [...new Set(newSnapPoints)];
    // Sort for safety (and explicitly give comparer because JS is STUPID AND SORTS BY ASCII BY DEFAULT)
    this.snapPoints.sort((a, b) => a - b);
  }
}
