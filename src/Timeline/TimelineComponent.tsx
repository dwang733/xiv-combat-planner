import React, { useEffect, useRef } from 'react';

import moment from 'moment/moment';
import { createNewDataPipeFrom } from 'vis-data/peer';
import { IdType, Timeline, TimelineOptions } from 'vis-timeline/peer';

import { ActionItemPartial, ActionItem } from '../actionTypes';
import TimelineItems from './TimelineItems';
import RotationPlanner from './RotationPlanner';

interface SelectEvent {
  items: IdType[];
  event: Event;
}

export default function TimelineComponent() {
  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);

  const rotationPlanner = new RotationPlanner();
  const timelineItems = new TimelineItems(rotationPlanner);

  const childrenEntered = new Set<EventTarget>();
  let selectionIds: IdType[] | null = null;
  let selectionItems: ActionItem[] = [];

  function onAdd(item: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const actionItem = item as ActionItem;
    actionItem.start = moment(actionItem.start).toISOString();

    rotationPlanner.addActions(actionItem, timelineItems.getCursorTime());
    callback(null);
  }

  function onMoving(item: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    // Base cursor on earliest selection's position
    if (selectionIds != null && item.id !== selectionIds[0]) {
      callback(null);
    }

    timelineItems.updateCursor(moment(item.start).toISOString());
    callback(null);
  }

  function onMove(item: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const actionItem = item as ActionItem;
    actionItem.start = moment(actionItem.start).toISOString();

    selectionItems.push(actionItem);
    if (selectionItems.length === selectionIds?.length) {
      rotationPlanner.moveActions(selectionItems, timelineItems.getCursorTime());
      selectionItems = [];
      timelineItems.removeCursor();
    }
    callback(null);
  }

  function onRemove(item: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const actionItem = item as ActionItem;
    rotationPlanner.removeActions(actionItem);
    callback(null);
  }

  const actionToTimelinePipe = createNewDataPipeFrom(rotationPlanner.actionItemsDataSet)
    // .map((item) => item)
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
  actionToTimelinePipe.all().start();

  // Configuration for the Timeline
  const options: TimelineOptions = {
    /** Horizontal axis time settings */
    start: -5 * 1000, // -5 sec
    end: 1 * 60 * 1000, // 1 min
    min: -30 * 1000, // -30 sec
    max: 30 * 60 * 1000, // 30 min
    /** Timeline dimensions */
    minHeight: 300,
    margin: {
      axis: 50,
    },
    /** Zoom settings */
    zoomMin: 10 * 1000,
    zoomMax: 10 * 60 * 1000,
    zoomFriction: 20,
    /* Selection settings */
    multiselect: true,
    sequentialSelection: true,
    /** Event listeners */
    editable: true,
    onAdd,
    onMoving,
    onMove,
    onRemove,
    /** Formatting settings */
    format: {
      minorLabels: (date, scale) => {
        // Show negative seconds in pre-pull
        const dateMoment = moment(date);
        if (scale === 'second') {
          const second = dateMoment.minute() < 40 ? dateMoment.second() : dateMoment.second() - 60;
          return second.toString();
        }

        return dateMoment.format('m[m]');
      },
      majorLabels: (date, scale) => {
        // Show negative minutes in pre-pull
        if (scale === 'second') {
          const dateMoment = moment(date);
          const minute = dateMoment.minute() < 40 ? dateMoment.minute() : dateMoment.minute() - 60;
          return `${minute}m`;
        }

        return '';
      },
    },
    moment: (date: moment.MomentInput) => moment.utc(date),
  };

  function handleSelect(properties: SelectEvent) {
    selectionIds = properties.items;
  }

  useEffect(() => {
    if (timeline.current == null) {
      timeline.current = new Timeline(timelineDivRef.current!, timelineItems, options);
      timeline.current!.on('select', handleSelect);
    }
  });

  /**
   * Get the item's start time based on the cursor's relative position to the timeline.
   * @param event The event that triggered the cursor start calculation.
   * @returns The item's start as an ISO string.
   */
  function getCursorTime(event: React.DragEvent<HTMLElement>) {
    const timeWindow = timeline.current!.getWindow();
    const timeStart = moment(timeWindow.start);
    const timeEnd = moment(timeWindow.end);
    const width = timelineDivRef.current!.offsetWidth;
    const x = event.clientX;

    // Get new item start based on ratio of cursor x pos and timeline window start
    const timeDiff = timeEnd.unix() - timeStart.unix();
    const secondsSinceTimeStart = timeDiff * (x / width);
    const itemStart = timeStart.add(secondsSinceTimeStart, 'seconds').toISOString();
    return itemStart;
  }

  function handleDragEnter(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    // Keep track of all drag enter events, including children.
    const oldNumChildren = childrenEntered.size;
    childrenEntered.add(event.target);
    if (oldNumChildren > 0) {
      return;
    }

    const start = getCursorTime(event);
    timelineItems.updateCursor(start);
  }

  function handleDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    const start = getCursorTime(event);
    timelineItems.updateCursor(start);
  }

  function handleDragLeave(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    // Set timeout for FireFox browser
    setTimeout(() => {
      // Remove drag enter event from set
      childrenEntered.delete(event.target);

      // Only remove cursor if exited all children or drop event triggered
      if (childrenEntered.size === 0) {
        timelineItems.removeCursor();
      }
    }, 1);
  }

  function handleDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    setTimeout(() => {
      childrenEntered.clear();
      timelineItems.removeCursor();
    }, 1);
  }

  return (
    <div
      id="visualization"
      ref={timelineDivRef}
      onDragEnterCapture={handleDragEnter}
      onDragOverCapture={handleDragOver}
      onDragLeaveCapture={handleDragLeave}
      onDropCapture={handleDrop}
    />
  );
}
