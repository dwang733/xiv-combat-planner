import React from 'react';
import ReactDOMServer from 'react-dom/server';

import { GCDItem, GCD, Job } from './actionTypes';

function ActionListItem(props: { action: GCD }) {
  const { action } = props;
  const iconPath = `./${action.job.toLowerCase()}/${action.name}.png`;
  const iconImageElement = <img src={iconPath} alt={action.name} />;

  function handleDragStart(eventArg: React.DragEvent<HTMLLIElement>) {
    const event = eventArg;
    event.dataTransfer.effectAllowed = 'move';
    const item: Partial<GCDItem> = {
      id: `${action.job}-${action.name}-${new Date().getTime()}`,
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
    <ActionListItem key={action.name} action={action} />
  ));

  return (
    <div id="actions-div">
      <ul id="actions">{actionListEntries}</ul>
    </div>
  );
}
