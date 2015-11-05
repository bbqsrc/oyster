import { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragDropContext } from 'react-dnd';

import HTML5Backend from 'react-dnd-html5-backend';

import AltContainer from 'alt/AltContainer';

import PollStore from './stores/poll-store';
import PollActions from './actions/poll-actions';

import { Controls, Button } from './components/bootstrap';
import BasePropertiesEditor from './components/base-properties-editor';
import Sections from './components/sections';

import $ from 'jquery';

@DragDropContext(HTML5Backend)
export default
class App extends Component {
  componentDidMount() {
    PollStore.fetchPoll();

    // Hijack links.
    const node = findDOMNode(this.refs.container);

    $(node).on('click', 'a', e => {
      e.preventDefault();
      return false;
    }).popover({
      trigger: 'click',
      selector: 'a[href]',
      placement: 'auto top',
      content: 'Clicking links blocked.'
    });
  }

  componentWillUnmount() {
    $(this.refs.containers).off('click', 'a');
  }

  render() {
    return (
      <AltContainer ref='container' store={PollStore} actions={PollActions}>
        <header className='page-header'>
          <div className='label label-danger' style={{ fontSize: '1em' }}>Early Prototype</div>
          <h1>Poll Editor</h1>
        </header>
        <BasePropertiesEditor />

        <Controls>
          <Button level='primary' onClick={PollActions.addNewSection}>
            Add new section
          </Button>
        </Controls>

        <Sections />
      </AltContainer>
    );
  }
}
