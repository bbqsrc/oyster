import { Component } from 'react';

import $ from 'jquery';

import Modal from './modal';

export default
class EditEmail extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      email: this.props.poll.email,
      windowHeight: window.innerHeight
    };
  }

  onClickEdit() {
    this.setState({
      editMode: true
    });
  }

  onChange(field, e) {
    const email = this.state.email;

    email[field] = e.target.value;

    this.setState({ email });
  }

  onWindowResize() {
    this.setState({
      windowHeight: window.innerHeight
    });
  }

  componentDidMount() {
    $(window).on('resize', this.onWindowResize.bind(this));
  }

  componentDidUnmount() {
    $(window).off('resize', this.onWindowResize.bind(this));
  }

  onModalHide() {
    this.setState({
      email: this.props.poll.email,
      editMode: false
    });
  }

  onModalSubmit() {
    const email = this.state.email;

    // Get ahead of primary source of truth update
    this.props.poll.email = email;

    $.ajax(`/api/poll/${this.props.poll.slug}`, {
      method: 'put',
      data: {
        email: email.toObject()
      }
    }).success(res => {
      $(window).trigger('poll:updated', res.poll);
    });
  }

  render() {
    const email = this.props.poll.email;

    this.modal = (
      <Modal
          size='lg'
          title='Edit email'
          visible={this.state.editMode}
          onHide={this.onModalHide.bind(this)}
          onClick={this.onModalSubmit.bind(this)}
          options={{ show: false, backdrop: 'static' }}
          btnClass='success' btnText='Save'
      >
        <div className='form'>
          <div className='form-group'>
            <label className='control-label' htmlFor='email-from'>From</label>
            <input className='form-control' id='email-from' value={this.state.email.from} onChange={this.onChange.bind(this, 'from')} />
          </div>

          <div className='form-group'>
            <label className='control-label' htmlFor='email-subject'>Subject</label>
            <input className='form-control' id='email-subject' value={this.state.email.subject} onChange={this.onChange.bind(this, 'subject')} />
          </div>

          <div className='form-group'>
            <label className='control-label' htmlFor='email-body'>Content</label>
            <textarea className='form-control' id='email-body' style={{ minHeight: this.state.windowHeight - 420 }}
                      value={this.state.email.content} onChange={this.onChange.bind(this, 'content')}/>
          </div>
        </div>
      </Modal>
    );

    return (
      <div className='col-md-6 col-email'>
        <header>
          <div className='pull-right'>
            <button ref='editBtn' className='btn btn-default btn-sm' onClick={this.onClickEdit.bind(this)}>Edit</button>
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
            <div style={{ whiteSpace: 'pre-wrap' }}>
              {email.content}
            </div>
          </div>
        </div>

        {this.modal}
      </div>
    );
  }
}
