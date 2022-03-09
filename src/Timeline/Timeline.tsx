import React, { useEffect, useRef } from 'react';

import { createNewDataPipeFrom, DataSet } from 'vis-data/peer';
import { Timeline, TimelineOptions } from 'vis-timeline/peer';
import moment from 'moment/moment';

import { GCDItemPartial, GCDItem } from '../actionTypes';

export default function TimelineComponent() {
  const actionItems = new DataSet<GCDItem>();
  const timelineItems = new DataSet<GCDItemPartial>();
  let isInDrag = false;

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);

  function onAdd(ti: GCDItemPartial, callback: (item: GCDItemPartial | null) => void) {
    const gcdItem = ti as GCDItem;
    gcdItem.start = moment(gcdItem.start).toISOString();

    // Manually add GCD to actionItems so pipeline can add additional items to timeline
    actionItems.add(gcdItem);
    callback(null);
  }

  function onMoving(ti: GCDItemPartial, callback: (item: GCDItemPartial | null) => void) {
    const gcdItem = ti as GCDItem;
    const actionItem = actionItems.get(gcdItem.id);
    if (moment(gcdItem.start).valueOf() !== moment(actionItem?.start).valueOf()) {
      actionItems.updateOnly({
        id: gcdItem.id,
        start: moment(gcdItem.start).toISOString(),
      });
    }
    callback(null);
  }

  function onRemove(ti: GCDItemPartial, callback: (item: GCDItemPartial | null) => void) {
    const gcdItem = ti as GCDItem;
    actionItems.remove(gcdItem.id);
    callback(null);
  }

  const actionToTimelinePipe = createNewDataPipeFrom(actionItems)
    // .map((item) => item)
    .flatMap((gcdItem) => {
      const gcdBackgroundItem: GCDItemPartial = {
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
    /** Event listeners */
    editable: true,
    onAdd,
    onMoving,
    onRemove,
    /** Formatting settings */
    format: {
      minorLabels: (date: Date, scale: string) => {
        // Show negative seconds in pre-pull
        const dateMoment = moment(date);
        if (scale === 'second') {
          const second = dateMoment.minute() < 40 ? dateMoment.second() : dateMoment.second() - 60;
          return second.toString();
        }

        return dateMoment.format('m[m]');
      },
      majorLabels: (date: Date, scale: string) => {
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
  useEffect(() => {
    if (timeline.current == null) {
      timeline.current =
        timelineDivRef.current && new Timeline(timelineDivRef.current, timelineItems, options);
    }
  });

  function getAddedItemStart(event: React.DragEvent<HTMLElement>) {
    const timeWindow = timeline.current!.getWindow();
    const width = timelineDivRef.current!.offsetWidth;
    const x = event.clientX;

    // Get new item start based on timeline window start and cursor Y pos
    const timeDiff = moment(timeWindow.end).unix() - moment(timeWindow.start).unix();
    const secondsSinceTimeWindowStart = timeDiff * (x / width);
    const itemStart = moment(timeWindow.start)
      .add(secondsSinceTimeWindowStart, 'seconds')
      .toISOString();
    return itemStart;
  }

  function onDragEnter(event: React.DragEvent<HTMLElement>) {
    if (isInDrag) {
      return;
    }

    event.preventDefault();
    isInDrag = true;

    const itemStart = getAddedItemStart(event);
    timelineItems.add({
      id: 'addDragItem',
      start: itemStart,
      content: 'add drag item',
    });
  }

  function onDragOver(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();

    const itemStart = getAddedItemStart(event);
    timelineItems.updateOnly({
      id: 'addDragItem',
      start: itemStart,
    });
  }

  function onDrop(event: React.DragEvent<HTMLElement>) {
    event.preventDefault();
    isInDrag = false;
  }

  return (
    <div
      id="visualization"
      ref={timelineDivRef}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDrop={onDrop}
    />
  );
}
