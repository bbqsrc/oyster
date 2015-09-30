import { Component } from 'react';
import AltContainer from 'alt/AltContainer';

import PollStore from './stores/poll-store';
import PollActions from './actions/poll-actions';

import BasePropertiesEditor from './components/base-properties-editor';
import { Button } from './components/bootstrap';

class Controls extends Component {
  render() {
    return (
      <div className='well'>
        {this.props.children}
      </div>
    );
  }
}

class SectionEditor extends Component {
  render() {
    return (
      <div>
        <h2>Section {this.props.index}</h2>
        <pre>{JSON.stringify(this.props, null, 2)}</pre>
        <button onClick={this.props.removeSection.bind(this, 0)}>Text</button>
      </div>
    );
  }
}

class Sections extends Component {
  render() {
    let editors = [];

    for (const o of this.props.sections) {
      editors.push(<AltContainer store={PollStore} actions={PollActions}>
        <SectionEditor index={0} section={o} />
      </AltContainer>);
    }

    return (
      <div>
        {editors}
      </div>
    );
  }
}

export default
class App extends Component {
  componentDidMount() {
    PollStore.fetchPoll();
  }

  render() {
    return (
      <div>
        <AltContainer store={PollStore} actions={PollActions}>
          <BasePropertiesEditor />
        </AltContainer>
        <AltContainer store={PollStore} actions={PollActions}>
          <Sections />
        </AltContainer>
        <Controls>
          <Button level='primary' onClick={PollActions.addNewSection}>
            Add new section
          </Button>
          <Button level='primary' onClick={PollActions.removeSection.bind(this, 0)}>
            Remove First
          </Button>
        </Controls>
      </div>
    );
  }
}
