import React from 'react';

import EditBallot from './edit-ballot';
import EditEmail from './edit-email';

function insertComponent(component, props, target) {
  if (arguments.length === 2) {
    target = props;
    props = undefined;
  }

  if (typeof target === 'string') {
    target = document.querySelector(target);
  }

  return React.render(React.createElement(component, props), target);
}

export default {
  insertComponent,
  EditBallot,
  EditEmail
};
