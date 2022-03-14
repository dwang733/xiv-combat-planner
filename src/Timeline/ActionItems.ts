import { RefObject } from 'react';

import moment from 'moment';
import { DataSet } from 'vis-data/peer';
import { Timeline, TimelineItem } from 'vis-timeline';

import { ActionItem } from '../actionTypes';

export default class ActionItems extends DataSet<ActionItem> {
  private ANIMATION_LOCK_IN_MS = 500;

  constructor(private timeline: RefObject<Timeline>) {
    super();
  }

  /**
   * Add an action item to the dataset.
   * @param itemArg The action item to add.
   * @returns Array with the ids (generated if not present) of the added items.
   */
  add(itemArg: ActionItem): (string | number)[] {
    const addItem = itemArg;

    const snapStart = this.getSnapPoint(addItem);
    addItem.start = snapStart;

    return super.add(addItem);
  }

  /**
   * @deprecated Please use `updateOnly()` instead for safety.
   */
  // eslint-disable-next-line class-methods-use-this
  update(): (string | number)[] {
    throw new Error(
      'ActionItems.update() is deprecated. Please use ActionItems.updateOnly() instead.'
    );
  }

  /**
   * Update existing items. When an item does not exist, an error will be thrown.
   * @param itemArg The updates (the id and optionally other props) to the action item.
   * @returns The ids of the updated items.
   */
  updateOnly(itemArg: ActionItem): (string | number)[] {
    const updateItem = itemArg;

    const actionItem = this.get(updateItem.id);
    if (moment(updateItem.start).valueOf() !== moment(actionItem?.start).valueOf()) {
      const snapPoint = this.getSnapPoint(updateItem);
      super.updateOnly({
        id: updateItem.id,
        start: snapPoint,
      });
    }

    return [];
  }

  /**
   * Remove an item by reference.
   * The method ignores removal of non-existing items,
   * and returns an array containing the ids of the items which are actually removed from the DataSet.
   * @param itemArg The action item to remove.
   * @returns The ids of the removed items.
   */
  remove(itemArg: ActionItem): (string | number)[] {
    return super.remove(itemArg);
  }

  /**
   * Gets the given timeline item's start to the closest snap point of the existing actions.
   * @param itemArg The action to snap to a time.
   * @returns The closest snap point to the given item as an ISO string.
   */
  getSnapPoint(itemArg: Pick<TimelineItem, 'id' | 'start'>): string {
    const itemToSnap = itemArg;
    if (this.length === 0) {
      return moment(0).toISOString();
    }

    const startInMs = moment(itemToSnap.start).valueOf();
    const itemsArray = this.get();

    const snapPoints = itemsArray.flatMap((item) => {
      // Don't allow item to snap to itself
      if (item.id === itemToSnap.id) {
        return [];
      }

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
        const itemLockEndInMs = itemStartInMs + this.ANIMATION_LOCK_IN_MS;
        itemSnapPoints.push(itemLockEndInMs);
      }
      return itemSnapPoints;
    });
    // Sort according to how close snap point is to item
    snapPoints.sort(
      (snapPointAInMs, snapPointBInMs) =>
        Math.abs(snapPointAInMs - startInMs) - Math.abs(snapPointBInMs - startInMs)
    );
    return moment(snapPoints[0]).toISOString();
  }
}
