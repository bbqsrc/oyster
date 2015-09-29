import React, { Component } from 'react';

import Modal from './modal';
import TomlValidator from './toml-validator';
import ThemeSelector from './theme-selector';

import ace from 'ace';
import $ from 'jquery';
import TOML from 'toml';

export default class EditPoll extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      canSubmit: true,
      content: this.props.poll.contentAsTOML(),
      theme: this.props.poll.theme,
      windowHeight: window.innerHeight
    };
  }

  onClickEdit() {
    if (!this.editor) {
      this.applyAceEditor();
    }

    this.editor.setValue(this.state.content);

    this.setState({
      editMode: true
    });
  }

  applyAceEditor() {
    const node = React.findDOMNode(this.refs.editor);

    const editor = ace.edit(node);

    editor.setTheme('ace/theme/monokai');
    editor.getSession().setMode('ace/mode/toml');

    editor.on('input', () => {
      this.setState({
        content: editor.getValue()
      });
    });

    this.editor = editor;
  }

  onModalHide() {
    this.setState({
      content: this.props.poll.contentAsTOML(),
      theme: this.props.poll.theme,
      editMode: false
    }, () => {
      // Ensure it gets the correct content
      this.editor.setValue(this.state.content);
    });
  }

  onModalSubmit() {
    const content = TOML.parse(this.state.content);
    const theme = this.state.theme;

    // Get ahead of the 'primary source of truth' updates
    this.props.poll.content = content;
    this.props.poll.theme = theme;

    $.ajax(`/api/poll/${this.props.poll.slug}`, {
      method: 'put',
      data: { content, theme }
    }).success(res => {
      $(window).trigger('poll:updated', res.poll);
    });
  }

  onWindowResize() {
    this.setState({
      windowHeight: window.innerHeight
    });
  }

  onChangeTheme(e) {
    this.setState({
      theme: e.target.value
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
        options={{ show: false, backdrop: 'static' }}
        btnClass='success' btnText='Save'
        btnEnabled={this.state.canSubmit}
      >
        <div className='form-group'>
          <label htmlFor='theme' className='control-label'>Theme</label>
          <ThemeSelector id='theme' className='form-control' value={this.state.theme} onChange={this.onChangeTheme.bind(this)}/>
        </div>
        <pre ref='editor' style={{ minHeight: this.state.windowHeight - 370 }}></pre>
        <TomlValidator onChange={v => this.setState({ canSubmit: v })} source={this.state.content} />
      </Modal>
    );

    return (
      <div className='col-md-6 col-ballot'>
        <header>
          <div className='pull-right'>
            <button ref='editBtn' className='btn btn-default btn-sm' onClick={this.onClickEdit.bind(this)}>Edit</button>
          </div>
          <h2>Ballot
            <small style={{ marginLeft: '1em' }}>
              <strong>Theme:</strong> {this.state.theme || 'no theme!'}
            </small>
          </h2>

        </header>

        <pre style={{ height: '36em' }}>
          {this.state.content}
        </pre>

        {this.modal}
      </div>
    );
  }
}

export { EditPoll as default };
