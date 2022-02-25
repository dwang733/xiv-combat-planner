import React, { useEffect, useRef } from "react";
import "./App.css";
import logo from "./logo.svg";
import { Timeline } from "vis-timeline";
import { DataSet } from "vis-data";

function TimelineComponent() {
  const items = useRef(
    new DataSet([
      { id: 1, content: "item 1", start: "2013-04-20" },
      { id: 2, content: "item 2", start: "2013-04-14" },
      { id: 3, content: "item 3", start: "2013-04-18" },
      { id: 4, content: "item 4", start: "2013-04-16", end: "2013-04-19" },
      { id: 5, content: "item 5", start: "2013-04-25" },
      { id: 6, content: "item 6", start: "2013-04-27" }
    ])
  );
  // Configuration for the Timeline
  const options = useRef({});

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  useEffect(
    () => {
      if (timeline.current == null) {
        timeline.current =
          timelineDivRef.current &&
          new Timeline(timelineDivRef.current, items.current, options.current);
      }
    },
    [timelineDivRef, items, options]
  );

  return <div id="visualization" ref={timelineDivRef} />;
}

function App(): JSX.Element {
  return (
    <div className="App">
      <header className="App-header">
        <script type="text/javascript" src="https://unpkg.com/moment@latest" />
        <script
          type="text/javascript"
          src="https://unpkg.com/vis-data@latest/peer/umd/vis-data.min.js"
        />
        <script
          type="text/javascript"
          src="https://unpkg.com/vis-timeline@latest/peer/umd/vis-timeline-graph2d.min.js"
        />
        <link
          rel="stylesheet"
          type="text/css"
          href="https://unpkg.com/vis-timeline/styles/vis-timeline-graph2d.min.css"
        />
      </header>

      <TimelineComponent />
    </div>
  );
}

export default App;
