import React, { createRef } from 'react';
import logo from './logo.svg';
import './App.css';
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";

class TimeLineComponent extends React.Component <{}> {

  private timelineDiv = createRef<HTMLDivElement>()

  componentDidMount() {
    // Create a DataSet (allows two way data-binding)
    var items = new DataSet([
      {id: 1, content: 'item 1', start: '2013-04-20'},
      {id: 2, content: 'item 2', start: '2013-04-14'},
      {id: 3, content: 'item 3', start: '2013-04-18'},
      {id: 4, content: 'item 4', start: '2013-04-16', end: '2013-04-19'},
      {id: 5, content: 'item 5', start: '2013-04-25'},
      {id: 6, content: 'item 6', start: '2013-04-27'}
    ]);

    // Configuration for the Timeline
    var options = {};

    // Create a Timeline
    var timeline = this.timelineDiv.current && new Timeline(this.timelineDiv.current, items, options);
  }

  render() {
    return (
      <div id="visualization" ref={this.timelineDiv}></div>
    )
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <script type="text/javascript" src="https://unpkg.com/moment@latest"></script>
        <script type="text/javascript" src="https://unpkg.com/vis-data@latest/peer/umd/vis-data.min.js"></script>
        <script type="text/javascript" src="https://unpkg.com/vis-timeline@latest/peer/umd/vis-timeline-graph2d.min.js"></script>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/vis-timeline/styles/vis-timeline-graph2d.min.css" />

        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>

      <TimeLineComponent />
    </div>
  );  
}

export default App;
