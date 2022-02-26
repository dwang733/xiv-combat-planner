import "vis-data/peer";
import "vis-timeline/peer";
import "vis-timeline/styles/vis-timeline-graph2d.min.css";

import React, { useEffect, useRef } from "react";
import "./App.css";
import logo from "./logo.svg";
import moment from "moment/moment";
import { Timeline } from "vis-timeline/peer";
import { DataSet } from "vis-data/peer";

function TimelineComponent() {
  const items = useRef(
    new DataSet([
      { id: 1, content: "item 1", start: 0 },
      { id: 2, content: "item 2", start: 1000 },
      { id: 3, content: "item 3", start: 2000 },
      { id: 4, content: "item 4", start: 3000, end: 5000 },
      { id: 5, content: "item 5", start: 4000 },
      { id: 6, content: "item 6", start: 5000 }
    ])
  );
  // // Configuration for the Timeline
  const options = useRef({
    start: -5000,
    end: 60000,
    min: -30000, // -30 sec
    max: 1800000, // 30 min
    format: {
      majorLabels: {
        second: "m[m]"
      }
    },
    zoomMin: 10000,
    zoomMax: 600000,
    moment: function(date: moment.MomentInput) {
      return moment(date).utc();
    }
  });

  const timelineDivRef = useRef<HTMLDivElement>(null);
  const timeline = useRef<Timeline | null>(null);
  useEffect(
    () => {
      if (timeline.current == null) {
        timeline.current =
          timelineDivRef.current &&
          new Timeline(timelineDivRef.current, items.current, options.current);
      }

      // timeline.current =
      //   timelineDivRef.current &&
      //   new Timeline(timelineDivRef.current, items.current, options.current);
    },
    [timelineDivRef, items, options]
  );

  return <div id="visualization" ref={timelineDivRef} />;
}

function App(): JSX.Element {
  return (
    <div className="App">
      <TimelineComponent />
    </div>
  );
}

export default App;
