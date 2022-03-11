import moment from 'moment';
import React, { RefObject } from 'react';
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

  moveCursor = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();

    const start = this.getAddedItemStart(event);
    this.updateOnly({
      id: this.CURSOR_ID,
      start,
      end: start,
    });
  };

  removeCursor = (event: React.DragEvent<HTMLElement>): void => {
    event.preventDefault();
    this.cursorItem = null;
    this.remove(this.CURSOR_ID);
  };

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
