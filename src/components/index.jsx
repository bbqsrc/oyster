/* eslint-disable no-param-reassign,no-undefined */

import React from 'react';

import AdminPollPage from './admin-poll-page';

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
  AdminPollPage
};
