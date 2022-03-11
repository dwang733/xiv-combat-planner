import { RefObject } from 'react';

import moment from 'moment';
import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline';

import { ActionItem } from '../actionTypes';

export default class ActionItems extends DataSet<ActionItem> {
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

    // Convert any DateType to string to ensure safety
    addItem.start = moment(addItem.start).toISOString();
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
      super.updateOnly({
        id: updateItem.id,
        start: moment(updateItem.start).toISOString(),
      });
    }

    return [];
  }
}
