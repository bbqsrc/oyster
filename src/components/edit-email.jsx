import { Component } from 'react';

export default
class EditEmail extends Component {
  render() {
    const email = this.props.poll.email;

    return (
      <div className='col-md-6 col-email'>
        <header>
          <div className='pull-right'>
            <button ref='editBtn' className='btn btn-default btn-sm' onClick={this.onClickEdit}>Edit</button>
          </div>
          <h2>Email</h2>
        </header>

        <div className="panel panel-default">
          <header className="panel-heading">
            <div>
              <strong>From: </strong> {email.from}
            </div>
            <div>
              <strong>Subject: </strong> {email.subject}
            </div>
          </header>
          <div className="panel-body">
            <div style={{'whiteSpace': 'pre-wrap'}}>
              {email.content}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
