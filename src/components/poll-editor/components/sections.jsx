import { Component } from 'react';
import AltContainer from 'alt/AltContainer';

import PollStore from '../stores/poll-store';
import PollActions from '../actions/poll-actions';

import Section from './section';

export default
class Sections extends Component {
  render() {
    return (
      <div>
        <AltContainer store={PollStore} actions={PollActions}>
          {this.props.sections.map((section, i) => {
            return <Section key={i} index={i} section={section} sectionTitle={section.title} />;
          })}
        </AltContainer>
      </div>
    );
  }
}
