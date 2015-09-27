import { Component } from 'react';

import PollOverview from './poll-overview';
import PollSettings from './poll-settings';
import PollParticipants from './poll-participants';
import EditEmail from './edit-email';
import EditBallot from './edit-ballot';

import { Poll } from '../models';

export default class AdminPollPage extends Component {
  constructor(props) {
    super(props);

    const doc = new mongoose.Document(props.poll, Poll);

    this.state = {
      poll: doc
    };
  }

  render() {
    return (
      <div>
        <div className='row'>
          <PollOverview poll={this.state.poll} />
          <PollSettings poll={this.state.poll} />
          <PollParticipants poll={this.state.poll} />
        </div>

        <div className='row'>
          <EditEmail poll={this.state.poll} />
          <EditBallot poll={this.state.poll} />
        </div>
      </div>
    );
  }
}
