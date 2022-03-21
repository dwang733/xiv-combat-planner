import { DataSet } from 'vis-data/peer';
import { TimelineItem } from 'vis-timeline/peer';

import RotationPlanner from './RotationPlanner';

export default class TimelineItems extends DataSet<TimelineItem> {
  private readonly CURSOR_ID = 'cursor';
  private cursorItem: TimelineItem | null = null;

  constructor(private rotationPlanner: RotationPlanner) {
    super();
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

    const snapStart = this.rotationPlanner.getClosestSnapPoint(this.cursorItem.start);
    this.cursorItem.start = snapStart;
    this.cursorItem.end = snapStart;

    this.update(this.cursorItem);
  }

  /**
   * Remove the cursor on the timeline if needed.
   */
  removeCursor() {
    this.cursorItem = null;
    this.remove(this.CURSOR_ID);
  }

  /**
   * Get the time where the cursor is at.
   */
  getCursorTime() {
    if (!this.cursorItem) {
      throw new Error('Cursor is not defined.');
    }

    return this.cursorItem.start;
  }
}
