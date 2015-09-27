import { Component } from 'react';

export default class PollParticipants extends Component {
  render() {
    return (
      <div className='col-md-4 col-participants'>
        <h2>Participants</h2>
        <ul>
          {this.props.poll.participantGroups.map(p => {
            return <li>{p}</li>;
          })}
        </ul>
      </div>
    );
  }
}
