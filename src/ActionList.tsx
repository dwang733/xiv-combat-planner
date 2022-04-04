import React, { MutableRefObject } from 'react';
import ReactDOMServer from 'react-dom/server';

import { Action, ActionItem, Job } from './actionTypes';

function ActionListItem(props: {
  action: Action;
  draggedAction: MutableRefObject<ActionItem | null>;
}) {
  const { action, draggedAction } = props;
  const iconPath = `./${action.job.toLowerCase()}/${action.name}.png`;
  const iconImageElement = <img src={iconPath} alt={action.name} />;

  function handleDragStart(event: React.DragEvent<HTMLElement>) {
    event.dataTransfer.effectAllowed = 'move';
    const item: ActionItem = {
      ...action,
      id: `${action.job}-${action.name}-${new Date().getTime()}`,
      type: 'point',
      className: 'timeline-action-item',
      content: ReactDOMServer.renderToStaticMarkup(iconImageElement),
      start: 0, // Filler value, will be substituted when drop is handled
    };

    const img = new Image();
    img.src = iconPath;
    event.dataTransfer.setDragImage(img, 32, 32);

    draggedAction.current = item;
  }

  return (
    <li draggable="true" className="action-list-item" onDragStart={handleDragStart}>
      {iconImageElement}
    </li>
  );
}

export default function ActionList(props: {
  job: Job;
  draggedAction: MutableRefObject<ActionItem | null>;
}) {
  const { job, draggedAction } = props;
  const actionListEntries = job.actions.map((action) => (
    <ActionListItem key={action.name} action={action} draggedAction={draggedAction} />
  ));

  return (
    <div id="actions-div">
      <ul id="actions">{actionListEntries}</ul>
    </div>
  );
}
