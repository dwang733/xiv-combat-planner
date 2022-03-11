import React, { useEffect, useRef } from 'react';

import moment from 'moment/moment';
import { createNewDataPipeFrom } from 'vis-data/peer';
import { Timeline, TimelineOptions } from 'vis-timeline/peer';

import { ActionItemPartial, ActionItem } from '../actionTypes';
import TimelineItems from './TimelineItems';
import ActionItems from './ActionItems';

export default function TimelineComponent() {
  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);

  const actionItems = new ActionItems(timeline);
  const timelineItems = new TimelineItems(timelineDivRef, timeline);

  function onAdd(ti: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const actionItem = ti as ActionItem;
    actionItems.add(actionItem);
    callback(null);
  }

  function onMoving(ti: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const actionItem = ti as ActionItem;
    actionItems.updateOnly(actionItem);
    callback(null);
  }

  function onRemove(ti: ActionItemPartial, callback: (item: ActionItemPartial | null) => void) {
    const gcdItem = ti as ActionItem;
    actionItems.remove(gcdItem.id);
    callback(null);
  }

  const actionToTimelinePipe = createNewDataPipeFrom(actionItems)
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
    /** Event listeners */
    editable: true,
    onAdd,
    onMoving,
    onRemove,
    /** Formatting settings */
    snap: (date) => {
      const dateInMs = moment(date).valueOf();
      // console.log(`dateInMs: ${dateInMs}`);
      const sortedActionItems = actionItems.get({
        order: 'start',
      });
      const snapPoints = sortedActionItems
        .flatMap((item) => {
          const itemStartInMs = moment(item.start).valueOf();
          const itemGCDEndInMs = itemStartInMs + item.nextGCD * 1000;
          const itemSnapPoints = [itemStartInMs, itemGCDEndInMs];
          if (item.castTime > 0) {
            const itemCastEndInMs = itemStartInMs + item.castTime * 1000;
            itemSnapPoints.push(itemCastEndInMs);
          }
          // console.log('item snap points');
          // console.log(itemSnapPoints);
          return itemSnapPoints;
        })
        .filter((snapPointInMs) => snapPointInMs < dateInMs);
      // console.log('snap points before sort:');
      // console.log(snapPoints);
      snapPoints.sort((snapPointAInMs, snapPointBInMs) => snapPointBInMs - snapPointAInMs);

      // console.log('snap points after sort:');
      // console.log(snapPoints);
      const closestTime = snapPoints.length > 0 ? moment(snapPoints[0]).toDate() : 0;
      // console.log(sortedActionItems.map((i) => i.start));
      // console.log(`snap closest time: ${closestTime}`);
      return closestTime;
    },
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

  useEffect(() => {
    if (timeline.current == null) {
      timeline.current =
        timelineDivRef.current && new Timeline(timelineDivRef.current, timelineItems, options);
    }
  });

  return (
    <div
      id="visualization"
      ref={timelineDivRef}
      onDragEnterCapture={timelineItems.addCursor}
      onDragOverCapture={timelineItems.moveCursor}
      onDropCapture={timelineItems.removeCursor}
    />
  );
}
