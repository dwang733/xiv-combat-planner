import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import './App.css';

import React, { useEffect, useRef } from 'react';
import ReactDOMServer from 'react-dom/server';

import { DataSet } from 'vis-data/peer';
import { Timeline, TimelineItem, TimelineOptions } from 'vis-timeline/peer';
import moment from 'moment/moment';

import { GCD, Job } from './actionTypes';
import Summoner from './jobs/summoner';

function ActionListItem(props: { job: Job; action: GCD }) {
  const { job, action } = props;
  const iconPath = `./${job.abbr.toLowerCase()}/${action.name}.png`;
  const iconImageElement = <img src={iconPath} alt={action.name} />;

  function handleDragStart(eventArg: React.DragEvent<HTMLLIElement>) {
    const event = eventArg;
    event.dataTransfer.effectAllowed = 'move';
    const item: Omit<TimelineItem, 'start'> = {
      id: new Date().toString(),
      type: 'box',
      content: ReactDOMServer.renderToStaticMarkup(iconImageElement),
    };
    event.dataTransfer.setData('text', JSON.stringify(item));
  }

  return (
    <li draggable="true" className="action-list-item" onDragStart={handleDragStart}>
      {iconImageElement}
    </li>
  );
}

function ActionList(props: { job: Job }) {
  const { job } = props;
  const actionListEntries = job.actions.map((action) => (
    <ActionListItem key={action.name} job={job} action={action} />
  ));

  return (
    <div id="actions-div">
      <ul id="actions">{actionListEntries}</ul>
    </div>
  );
}

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
  const options = useRef<TimelineOptions>({
    start: -5 * 1000, // -5 sec
    end: 1 * 60 * 1000, // 1 min
    min: -30 * 1000, // -30 sec
    max: 30 * 60 * 1000, // 30 min
    minHeight: 300,
    zoomMin: 10 * 1000,
    zoomMax: 10 * 60 * 1000,
    zoomFriction: 20,
    editable: true,
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
    moment: (date: moment.MomentInput) => moment(date).utc(),
  });

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  useEffect(() => {
    if (timeline.current == null) {
      timeline.current =
        timelineDivRef.current &&
        new Timeline(timelineDivRef.current, items.current, options.current);
    }
  }, [timelineDivRef, items, options]);

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
