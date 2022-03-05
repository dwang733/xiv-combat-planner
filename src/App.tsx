import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import './App.css';

import React, { useEffect, useRef } from 'react';

import { createNewDataPipeFrom, DataSet } from 'vis-data/peer';
import { Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/peer';
import moment from 'moment/moment';

import Summoner from './jobs/summoner';
import ActionList from './ActionList';
import { DatasetItem, GCDItem } from './actionTypes';

function TimelineComponent() {
  const actionItems = useRef(new DataSet<DatasetItem>());
  const timelineItems = useRef(new DataSet<DatasetItem>());

  function onAdd(ti: TimelineItem, callback: (item: TimelineItem | null) => void) {
    const gcdItem = ti as GCDItem;

    // Manually add GCD to actionItems so pipeline can add additional items to timeline
    actionItems.current.add(gcdItem);
    callback(null);
  }

  const actionToTimelinePipe = createNewDataPipeFrom(actionItems.current)
    .map((item) => item)
    .flatMap((gcdItem) => {
      const gcdBackgroundItem: DatasetItem = {
        id: `${gcdItem.id}-gcdBackground`,
        content: '',
        start: gcdItem.start,
        end: moment(gcdItem.start).add(gcdItem.nextGCD, 'seconds').toDate(),
        type: 'background',
      };
      return [gcdItem, gcdBackgroundItem];
    })
    .to(timelineItems.current);
  actionToTimelinePipe.all().start();

  // Configuration for the Timeline
  const options = useRef<TimelineOptions>({
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
    moment: (date: moment.MomentInput) => moment(date).utc(),
  });

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  useEffect(() => {
    if (timeline.current == null) {
      timeline.current =
        timelineDivRef.current &&
        new Timeline(timelineDivRef.current, timelineItems.current, options.current);
    }
  }, [timelineDivRef, timelineItems, options]);

  return <div id="visualization" ref={timelineDivRef} />;
}

function App() {
  return (
    <div className="App">
      <TimelineComponent />

      <div id="actions-div">
        <ActionList job={new Summoner()} />
      </div>
    </div>
  );
}

export default App;
