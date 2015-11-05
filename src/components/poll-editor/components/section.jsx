import { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import AltContainer from 'alt/AltContainer';

import { Types, canDrop, hoverHandler } from '../dnd';
import { Controls, Button, FormInput, FormTextarea, FormSelect } from './bootstrap';
import Markdown from './markdown';
import FieldEditor from './field';

import PollStore from '../stores/poll-store';
import PollActions from '../actions/poll-actions';

import $ from 'jquery';

class SectionEditor extends Component {
  constructor(props) {
    super(props);

    this.state = this.props.section;

    if (!this.state.type) {
      this.state.type = 'motion';
    }
  }

  update() {
    PollActions.updateSection({
      section: this.props.index,
      state: this.state
    });

    this.props.onDone();
  }

  onChange(e) {
    const { value } = e.target;
    const id = e.target.dataset.id;
    const state = {};

    state[id] = value;

    this.setState(state);
  }

  componentDidMount() {
    $(findDOMNode(this.refs.first)).find('input').focus();
  }

  renderTypeSpecific() {
    const section = this.state;

    if (section.type === 'election') {
      return (
        <FormSelect label='Election method' data-id='method' horizontal
                     id={`section-method-${this.props.index}`} value={section.method}
                     onChange={this.onChange.bind(this)}>
          <option value='schulze'>Schulze</option>
          <option value='approval'>Approval</option>
        </FormSelect>
      );
    } else if (section.type === 'motion') {
      return (
        <FormSelect label='Motion threshold' data-id='threshold' horizontal
                     id={`section-threshold-${this.props.index}`} value={section.threshold}
                     onChange={this.onChange.bind(this)}>
          <option value='simple'>Simple majority (> 50%)</option>
          <option value='two-thirds'>Two-thirds majority</option>
        </FormSelect>
      );
    }
  }

  render() {
    return (
      <div>
        <div className='form form-horizontal row'>
          <div className='col-md-10'>
            <FormInput ref='first' label='Section Title' data-id='title' id={`section-title-${this.props.index}`} value={this.state.title} horizontal onChange={this.onChange.bind(this)} />

            <FormSelect label='Section Type' data-id='type' disabled={!this.props.section.isNew} value={this.state.type} onChange={this.onChange.bind(this)} horizontal>
              <option value='motion'>Motion</option>
              <option value='election'>Election</option>
            </FormSelect>

            {this.renderTypeSpecific()}

            <FormTextarea label='Section Information' data-id='info' id={`section-info-${this.props.index}`} value={this.state.info} onChange={this.onChange.bind(this)} horizontal rows='8' />
          </div>
        </div>
        <div>
          <Button level='success' onClick={this.update.bind(this)}>Save</Button>
          <Button level='link' onClick={this.props.onDone}>Cancel</Button>
        </div>
      </div>
    );
  }
}

@DragSource(Types.SECTION, {
  beginDrag(props) {
    return {
      sectionTitle: props.sectionTitle,
      index: props.index
    };
  },
  isDragging(props, monitor) {
    return props.sectionTitle === monitor.getItem().sectionTitle;
  }
}, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
}))
@DropTarget(Types.SECTION, {
  canDrop: canDrop.bind(null, 'sectionTitle'),
  hover: hoverHandler.bind(null, 'moveSection', (props, item) => ([
    item.sectionTitle,
    props.sectionTitle
  ]))
}, (connect) => ({
  connectDropTarget: connect.dropTarget()
}))
export default
class Section extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: props.section.isNew || false
    };
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

  renderTypeSpecific() {
    const { section } = this.props;

    if (section.type === 'motion') {
      return (
        <div>
          <strong>Threshold: </strong>
          <span>{section.threshold || 'simple'}</span>
        </div>
      );
    }

    if (section.type === 'election') {
      return (
        <div>
          <strong>Method: </strong>
          <span>{section.method || 'schulze'}</span>
        </div>
      );
    }
  }

  renderSectionHeader() {
    const { section } = this.props;

    if (this.state.editMode) {
      return (
        <SectionEditor section={section} index={this.props.index} onDone={this.clickCancel.bind(this)} />
      );
    } else {
      return (
        <div>
          <div className='pull-right'>
            <Button level='default' onClick={this.clickEdit.bind(this)}>Edit</Button>
          </div>

          <h2>
            {section.title}
            <small style={{ marginLeft: '.5em' }}>
              Type: {section.type}
            </small>
          </h2>

          {this.renderTypeSpecific()}

          <blockquote>
            <Markdown>
              {section.info}
            </Markdown>
          </blockquote>
        </div>
      );
    }
  }

  render() {
    const { section, isDragging, connectDragSource, connectDragPreview, connectDropTarget } = this.props;

    const opacity = isDragging ? 0 : 1;

    return connectDragPreview(connectDropTarget(
      <div style={{ padding: '1em', border: '1px solid gray', opacity }}>
        {connectDragSource(
        <div>
          <Controls>
            <Button level='primary' onClick={this.props.newFieldForSection.bind(this, this.props.index)}>New field</Button>
            <div className='pull-right'>
              <Button level='danger' size='sm' onClick={this.props.removeSection.bind(this, this.props.index)}>&times;</Button>
            </div>
          </Controls>
        </div>
        )}

        <div className='panel panel-default'>
          {/*
            <div className='panel-heading'>
              <div className="input-group">
                <h4 className='panel-title'>Text goes here</h4>
                <div className="input-group-btn">
                  <button className="btn btn-default btn-xs" type="button">Edit</button>
                </div>
              </div>
            </div>
          */}
          <div className='panel-body'>
            {this.renderSectionHeader()}

            <hr />

            <AltContainer store={PollStore} actions={PollActions}>
              {section.fields.map((field, i) => {
                return <FieldEditor section={this.props.index} type={section.type} field={field} fieldId={field.id} key={i} index={i} />;
              })}
            </AltContainer>
          </div>
        </div>
      </div>
    ));
  }
}
