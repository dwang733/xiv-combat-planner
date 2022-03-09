import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import './App.css';

import React from 'react';

import TimelineComponent from './Timeline/Timeline';
import ActionList from './ActionList';
import Summoner from './jobs/summoner';

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
