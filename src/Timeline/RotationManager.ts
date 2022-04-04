import { createNewDataPipeFrom, DataPipe, DataSet } from 'vis-data/peer';

import { ActionItem, ActionItemPartial, SafeTimelineItem } from '../actionTypes';

const ANIMATION_LOCK = 600;

function createActionToTimelinePipeline(
  actionItems: DataSet<ActionItem>,
  timelineItems: DataSet<SafeTimelineItem>
) {
  return createNewDataPipeFrom(actionItems)
    .flatMap((action) => {
      if (!action.isGCD) {
        return [action];
      }

      const gcdBackgroundItem: ActionItemPartial = {
        id: `${action.id}-gcdBackground`,
        content: '',
        start: action.start,
        end: action.start + action.nextGCD,
        type: 'background',
      };
      return [action, gcdBackgroundItem];
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
  private cursorItem: SafeTimelineItem | null = null;

  public actionItemsDataSet = new DataSet<ActionItem>();
  public timelineItemsDataSet = new DataSet<SafeTimelineItem>();

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
   * @param cursorTime The cursor's position in milliseconds.
   */
  updateCursor(cursorTime: number) {
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
  getClosestSnapPoint(time: number): number {
    // TODO: Fix snapping
    if (this.snapPoints.length === 0) {
      return 0;
    }

    // Binary search generously contributed by Shinu
    let startIdx = 0;
    let stepSize = 2 ** Math.floor(Math.log2(this.snapPoints.length));

    while (stepSize >= 1) {
      const pivotPoint = this.snapPoints[startIdx + stepSize];
      if (pivotPoint && pivotPoint <= time) {
        startIdx += stepSize;
      }

      stepSize /= 2;
    }

    // Return the closest between the last value checked and its right neighbor
    const neighbors = this.snapPoints.slice(startIdx, startIdx + 2);
    const best = neighbors.reduce((b, el) => (Math.abs(el - time) < Math.abs(b - time) ? el : b));
    return best;
  }

  private recalculateRotation(actions: ActionItem | ActionItem[], type: 'add' | 'remove' | 'move') {
    const actionsArray = Array.isArray(actions) ? actions : [actions];
    actionsArray.sort((a, b) => a.start - b.start);

    let removeIndex: number = Infinity;
    if (type === 'remove' || type === 'move') {
      const actionIds = actionsArray.map((a) => a.id);
      removeIndex = this.actionItemsArray.findIndex((a) => a.start >= actionsArray[0].start);

      this.actionItemsArray = this.actionItemsArray.filter((a) => !actionIds.includes(a.id));
      this.actionItemsDataSet.remove(actionIds);
    }

    let addIndex: number = Infinity;
    if (type === 'add' || type === 'move') {
      const cursorTime = this.cursorItem!.start;
      const snapPoint = this.getClosestSnapPoint(cursorTime);
      addIndex = this.actionItemsArray.findIndex((a) => a.start >= snapPoint);

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

    /* Recalculate start time for affected actions */
    const startIndex = Math.min(addIndex, removeIndex);
    const prevAction = this.actionItemsArray[startIndex - 1];
    let nextActionStart = prevAction
      ? prevAction.start + Math.max(prevAction.castTime, ANIMATION_LOCK)
      : 0;

    let prevGCDIndex = startIndex - 1;
    while (prevGCDIndex >= 0 && !this.actionItemsArray[prevGCDIndex].isGCD) {
      prevGCDIndex -= 1;
    }
    let nextGCDStart =
      prevGCDIndex >= 0
        ? this.actionItemsArray[prevGCDIndex].start + this.actionItemsArray[prevGCDIndex].nextGCD
        : 0;

    for (let i = startIndex; i < this.actionItemsArray.length; i += 1) {
      const currentAction = this.actionItemsArray[i];
      if (currentAction.isGCD) {
        currentAction.start = Math.max(nextActionStart, nextGCDStart);
        nextGCDStart = currentAction.start + currentAction.nextGCD;
      } else {
        currentAction.start = nextActionStart;
      }

      nextActionStart = currentAction.start + Math.max(currentAction.castTime, ANIMATION_LOCK);
      this.actionItemsDataSet.updateOnly(currentAction);
    }

    this.recalculateSnapPoints();
  }

  private recalculateSnapPoints() {
    // TODO: Redo snap points calculation
    const newSnapPoints = this.actionItemsArray.flatMap((item) => {
      const itemSnapPoints = [item.start];
      if (item.nextGCD > 0) {
        // Add snap points for GCD
        const itemGCDEnd = item.start + item.nextGCD;
        itemSnapPoints.push(itemGCDEnd);
        if (item.castTime > 0) {
          const itemCastEnd = item.start + item.castTime;
          itemSnapPoints.push(itemCastEnd);
        }
      } else {
        // Add snap points for oGCD
        const itemLockEnd = item.start + ANIMATION_LOCK;
        itemSnapPoints.push(itemLockEnd);
      }

      return itemSnapPoints;
    });

    // Remove duplicates
    this.snapPoints = [...new Set(newSnapPoints)];
    // Sort for safety (and explicitly give comparer because JS is STUPID AND SORTS BY ASCII BY DEFAULT)
    this.snapPoints.sort((a, b) => a - b);
  }
}
