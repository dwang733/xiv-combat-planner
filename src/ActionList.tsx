import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { GCDItem, GCD, Job } from './actionTypes';

function ActionListItem(props: { job: Job; action: GCD }) {
  const { job, action } = props;
  const iconPath = `./${job.abbr.toLowerCase()}/${action.name}.png`;
  const iconImageElement = <img src={iconPath} alt={action.name} />;

  function handleDragStart(eventArg: React.DragEvent<HTMLLIElement>) {
    const event = eventArg;
    event.dataTransfer.effectAllowed = 'move';
    const item: Partial<GCDItem> = {
      id: `${job}-${action.name}-${new Date().toString()}`,
      type: 'point',
      content: ReactDOMServer.renderToStaticMarkup(iconImageElement),
      ...action,
    };
    event.dataTransfer.setData('text', JSON.stringify(item));
  }

  return (
    <li draggable="true" className="action-list-item" onDragStart={handleDragStart}>
      {iconImageElement}
    </li>
  );
}

export default function ActionList(props: { job: Job }) {
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
