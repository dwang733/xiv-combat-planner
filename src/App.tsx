import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import './App.css';

import React, { useEffect, useRef } from 'react';

import { DataSet } from 'vis-data/peer';
import { Timeline } from 'vis-timeline/peer';
import moment from 'moment/moment';
import Summoner from './jobs/summoner';

function TimelineComponent() {
  const items = useRef(
    new DataSet([
      { id: 1, content: 'item 1', start: 0 },
      { id: 2, content: 'item 2', start: 1000 },
      { id: 3, content: 'item 3', start: 2000 },
      { id: 4, content: 'item 4', start: 3000, end: 5000 },
      { id: 5, content: 'item 5', start: 4000 },
      { id: 6, content: 'item 6', start: 5000 },
    ])
  );
  // // Configuration for the Timeline
  const options = useRef({
    start: -5 * 1000, // -5 sec
    end: 1 * 60 * 1000, // 1 min
    min: -30 * 1000, // -30 sec
    max: 30 * 60 * 1000, // 30 min
    minHeight: 300,
    zoomMin: 10 * 1000,
    zoomMax: 10 * 60 * 1000,
    zoomFriction: 20,
    format: {
      minorLabels: {
        second: 's',
        minute: 'm[m]',
      },
      majorLabels: (date: Date, scale: string) => {
        if (scale !== 'second') {
          return '';
        }

        const dateMoment = moment(date);
        return dateMoment.minute() < 59 ? dateMoment.format('m[m]') : '-1m';
      },
    },
    moment(date: moment.MomentInput) {
      return moment(date).utc();
    },
  });

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  useEffect(() => {
    if (timeline.current == null) {
      timeline.current =
        timelineDivRef.current &&
        new Timeline(timelineDivRef.current, items.current, options.current);
    }

    // timeline.current =
    //   timelineDivRef.current &&
    //   new Timeline(timelineDivRef.current, items.current, options.current);
    const test = new Summoner();
    console.log(`Name: ${test.summonBahamut.name}, nextGCD: ${test.summonBahamut.nextGCD}`);
  }, [timelineDivRef, items, options]);

  return <div id="visualization" ref={timelineDivRef} />;
}

function App() {
  return (
    <div className="App">
      <TimelineComponent />
    </div>
  );
}

export default App;
