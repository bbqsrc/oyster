import React, { Component } from 'react';
import { findDOMNode } from 'react-dom'

import Markdown from './markdown';
import { Controls, Button, FormInput, FormTextarea } from './bootstrap';

class BasePropertiesEditor extends Component {
  constructor(props) {
    super(props);

    const { pageTitle, title, info } = props;

    this.state = { pageTitle, title, info };
  }

  clickSave() {
    const { pageTitle, title, info } = this.state;

    this.props.updateBaseProperties({ pageTitle, title, info });
    this.props.onDone();
  }

  onChange(e) {
    const { id, value } = e.target;
    const o = {};

    o[id] = value;

    this.setState(o);
  }

  componentDidMount() {
    if (this.props.isNew) {
      $(findDOMNode(this.refs.first)).find('input').focus();
    }
  }

  render() {
    return (
      <div>
        <div className='panel panel-default'>
          <div className='panel-body'>
            <div className='row'>
              <div className='col-md-10'>
                <FormInput ref='first' label='Page Title' id='pageTitle' value={this.state.pageTitle} onChange={this.onChange.bind(this)} />
                <FormInput label='Title' id='title' value={this.state.title} onChange={this.onChange.bind(this)} />
                <FormTextarea rows='8' label='Info' id='info' value={this.state.info} onChange={this.onChange.bind(this)} />
              </div>
            </div>
          </div>
          <div className='panel-footer'>
            <Button level='primary' onClick={this.clickSave.bind(this)}>Save</Button>
            <Button level='link' onClick={this.props.onDone}>Cancel</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default
class BaseProperties extends Component {
  constructor(props) {
    super(props);

    this.state = { editMode: props.isNew || false };
  }

  clickEdit() {
    this.setState({
      editMode: true
    });
  }

  clickCancel() {
    this.setState({
      editMode: false
    });
  }

  render() {
    if (this.state.editMode) {
      return <BasePropertiesEditor {...this.props} onDone={this.clickCancel.bind(this)}/>;
    }

    return (
      <div>
        <div className='pull-right'>
          <Button level='default' onClick={this.clickEdit.bind(this)}>Edit</Button>
        </div>
        <h1>{this.props.title}</h1>
        <blockquote>
          <Markdown>
            {this.props.info}
          </Markdown>
        </blockquote>
      </div>
    );
  }
}
