import { Component } from 'react';

import Modal from './modal';

import ace from 'ace';
import $ from 'jquery';

export default
class EditEmail extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <header>
          <div className='pull-right'>
            <button ref='editBtn' className='btn btn-default btn-sm' onClick={this.onClickEdit}>Edit</button>
          </div>
          <h2>Email</h2>
        </header>

        <div className="panel panel-default">
          <header className="panel-heading">
            <div>
              <strong>From: </strong> {this.props.from}
            </div>
            <div>
              <strong>Subject: </strong> {this.props.subject}
            </div>
          </header>
          <div className="panel-body">
            <div style={{'whiteSpace': 'pre-wrap'}}>
              {this.props.content}
            </div>
          </div>
        </div>
      </div>
    );
  }
}
