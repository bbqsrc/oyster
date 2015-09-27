import React, { Component } from 'react';

import Modal from './modal';
import TomlValidator from './toml-validator';

import ace from 'ace';
import $ from 'jquery';

export default class EditPoll extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      content: props.poll.contentAsTOML(),
      windowHeight: window.innerHeight
    };
  }

  onClickEdit() {
    if (!this.editor) {
      this.applyAceEditor();
    }

    this.setState({
      editMode: true
    });
  }

  applyAceEditor() {
    let node = React.findDOMNode(this.refs.editor);

    let editor = ace.edit(node);
    editor.setTheme('ace/theme/monokai');
    editor.getSession().setMode('ace/mode/toml');

    editor.setValue(this.state.content);
    editor.on('input', function() {
      // TODO: move into AceEditor obj.
      this.setState({
        content: editor.getValue()
      });
    }.bind(this));

    this.editor = editor;
  }

  onModalHide() {
    this.setState({
      editMode: false
    });
  }

  onModalSubmit() {
    this.setState({
      content: this.editor.getValue()
    });
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

  render() {
    this.modal = (
      <Modal
          size='lg'
          title='Edit ballot template'
          visible={this.state.editMode}
          onHide={this.onModalHide.bind(this)}
          onClick={this.onModalSubmit.bind(this)}
          options={{show: false, backdrop: 'static'}}
          btnClass='success' btnText='Save'
      >
        <pre ref='editor' style={{minHeight: this.state.windowHeight - 300}}></pre>
        <TomlValidator source={this.state.content} />
      </Modal>
    );

    return (
      <div className='col-md-6 col-ballot'>
        <header>
          <div className='pull-right'>
            <button ref='editBtn' className='btn btn-default btn-sm' onClick={this.onClickEdit.bind(this)}>Edit</button>
          </div>
          <h2>Ballot
            <small style={{marginLeft: '1em'}}>
              <strong>Theme:</strong> {this.props.poll.theme || 'no theme!'}
            </small>
          </h2>

        </header>

        <pre style={{height: '36em'}}>
          {this.state.content}
        </pre>

        {this.modal}
      </div>
    );
  }
}

export { EditPoll as default };
