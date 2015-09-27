import { Component } from 'react';

import moment from 'moment';

function timeRow(label, time) {
  return (
    <tr>
      <th>{label}</th>
      <td>
        <time title={time.toISOString()} datetime={time.toISOString()}>
          {time.format('llll Z')}
        </time>
      </td>
    </tr>
  );
}

export default class PollOverview extends Component {
  renderStatus() {
    const poll = this.props.poll;
    let cell;

    if (poll.results) {
      cell = <span className='label label-success'>Finished</span>;
    } else if (+poll.startTime < Date.now()) {
      cell = <span className='label label-warning'>Running</span>;
    } else {
      cell = <span className='label label-info'>Scheduled</span>;
    }

    return (
      <tr>
        <th>Status</th>
        <td>{cell}</td>
      </tr>
    );
  }

  renderVisibility() {
    const poll = this.props.poll;
    let cell;

    if (poll.isPublic) {
      cell = <span className='label label-success'>Public</span>;
    } else {
      cell = <span className='label label-warning'>Private</span>;
    }

    return (
      <tr>
        <th>Visibility</th>
        <td>{cell}</td>
      </tr>
    );
  }

  renderStart() {
    const time = moment(this.props.poll.startTime);
    return timeRow('Start', time);
  }

  renderEnd() {
    const time = moment(this.props.poll.endTime);
    return timeRow('End', time);
  }

  renderEmailsSent() {
    const poll = this.props.poll;

    return (
      <tr>
        <th>Emails sent</th>
        <td>{poll.emailsSent.length}</td>
      </tr>
    );
  }

  render() {
    const rows = [
      this.renderStatus(),
      this.renderVisibility(),
      this.renderStart(),
      this.renderEnd(),
      this.renderEmailsSent()
    ];

    return (
      <div className='col-md-4 col-overview'>
        <h2>Overview</h2>

        <table className='table'>
          {rows}
        </table>
      </div>
    );
  }
}
