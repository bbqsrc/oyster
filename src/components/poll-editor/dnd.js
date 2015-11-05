import { findDOMNode } from 'react-dom';

export const Types = {
  SECTION: Symbol('Section'),
  FIELD: Symbol('Field')
};

export function canDrop(propName, props, monitor) {
  const dragId = monitor.getItem()[propName];
  const hoverId = props[propName];

  if (dragId === hoverId) {
    // Over self, can't drop here
    return false;
  }

  return true;
}

export function hoverHandler(actionName, actionParamGetter, props, monitor, component) {
  // Index of the item being dragged
  const dragIndex = monitor.getItem().index;
  // Index of the item being hovered over
  const hoverIndex = props.index;

  if (!monitor.canDrop()) {
    // Not a valid target, do nothing
    return;
  }

  // Bounding box for the item being hovered over
  const hoverBounds = findDOMNode(component).getBoundingClientRect();

  // Vertical midpoint of the item being hovered over
  const hoverMiddleY = (hoverBounds.bottom - hoverBounds.top) / 2;

  // Pointer coordinates
  const clientOffset = monitor.getClientOffset();

  // Determine how far the pointer is from the top of the hovered element
  const hoverClientY = clientOffset.y - hoverBounds.top;

  // Dragging down
  if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
    // Not past vertical midpoint yet, do nothing
    return;
  }

  // Dragging up
  if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
    // Not past vertical midpoint yet, do nothing
    return;
  }

  // Invoke the action with parameters from getter (func of props & item)
  props[actionName](...actionParamGetter(props, monitor.getItem()));
}
