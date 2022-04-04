import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import './App.css';

import React, { useRef } from 'react';

import TimelineComponent from './Timeline';
import ActionList from './ActionList';
import Summoner from './jobs/summoner';
import { ActionItem } from './actionTypes';

function App() {
  const draggedAction = useRef<ActionItem | null>(null);

  return (
    <div className="App">
      <TimelineComponent draggedAction={draggedAction} />

      <div id="actions-div">
        <ActionList job={new Summoner()} draggedAction={draggedAction} />
      </div>
    </div>
  );
}

export default App;
