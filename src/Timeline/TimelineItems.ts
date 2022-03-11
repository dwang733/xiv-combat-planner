import React, { RefObject } from 'react';

import moment from 'moment';
import { DataSet } from 'vis-data/peer';
import { Timeline, TimelineItem } from 'vis-timeline/peer';

export default class TimelineItems extends DataSet<TimelineItem> {
  private readonly CURSOR_ID = 'cursor';
  private cursorItem: TimelineItem | null = null;

  constructor(
    private timelineDivRef: RefObject<HTMLDivElement>,
    private timeline: RefObject<Timeline>
  ) {
    super();
  }

  /**
   * Add the cursor to the timeline.
   * @param event The drag event that triggered adding the cursor.
   */
  addCursor = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    if (this.cursorItem != null) {
      return;
    }

    const start = this.getAddedItemStart(event);
    this.cursorItem = {
      id: this.CURSOR_ID,
      start,
      end: start,
      type: 'range',
      className: 'timeline-cursor',
      content: '',
    };
    this.add(this.cursorItem);
  };

  /**
   * Move the cursor on the timeline.
   * @param event The drag event that triggered moving the cursor.
   */
  moveCursor = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();

    const start = this.getAddedItemStart(event);
    this.updateOnly({
      id: this.CURSOR_ID,
      start,
      end: start,
    });
  };

  /**
   * Remove the cursor on the timeline.
   * @param event The drag event that triggered removing the cursor.
   */
  removeCursor = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    this.cursorItem = null;
    this.remove(this.CURSOR_ID);
  };

  /**
   * Get the item's start time based on the cursor's relative position to the timeline.
   * @param event The event that triggered the cursor start calculation.
   * @returns The item's start as an ISO string.
   */
  private getAddedItemStart(event: React.DragEvent<HTMLElement>) {
    const timeWindow = this.timeline.current!.getWindow();
    const timeStart = moment(timeWindow.start);
    const timeEnd = moment(timeWindow.end);
    const width = this.timelineDivRef.current!.offsetWidth;
    const x = event.clientX;

    // Get new item start based on ratio of cursor x pos and timeline window start
    const timeDiff = timeEnd.unix() - timeStart.unix();
    const secondsSinceTimeStart = timeDiff * (x / width);
    const itemStart = timeStart.add(secondsSinceTimeStart, 'seconds').toISOString();
    return itemStart;
  }
}
