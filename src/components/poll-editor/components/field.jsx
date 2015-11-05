import { Component } from 'react';
import { findDOMNode } from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';

import { Types, canDrop, hoverHandler } from '../dnd';
import { Button, FormInput, FormTextarea } from './bootstrap';
import Markdown from './markdown';

import PollActions from '../actions/poll-actions';

import $ from 'jquery';

class ElectionFieldEditor extends Component {
  constructor(props) {
    super(props);

    this.state = this.props.field;

    if (!this.state.candidates) {
      this.state.candidates = [];
    }
  }

  update() {
    const section = this.props.section;
    const field = this.props.index;
    const state = this.state;

    PollActions.updateField({ section, field, state });

    this.props.onDone();
  }

  onChange(e) {
    const { id, value } = e.target;
    const state = {};

    state[id] = value;

    this.setState(state);
  }

  componentDidMount() {
    $(findDOMNode(this.refs.first)).find('input').focus();
  }

  onChangeCandidate(index, e) {
    const { candidates } = this.state;

    candidates[index] = e.target.value;

    this.setState({ candidates });
  }

  onRemoveCandidate(index) {
    const { candidates } = this.state;

    candidates.splice(index, 1);

    this.setState({ candidates });
  }

  onAddCandidate() {
    const { candidates } = this.state;

    candidates.push('');

    this.setState({ candidates }, function() {
      $(this.refs.rows).find('input').last().focus();
    });
  }

  render() {
    return (
      <div style={{ padding: '1em', border: '1px solid gray' }}>
        <div className='row'>
          <div className='col-md-10 form form-horizontal'>
            <FormInput ref='first' label='Position' id='id' horizontal={true} value={this.state.id} onChange={this.onChange.bind(this)} />

            <header>
              <h4>Candidates</h4>
            </header>

            <div>
              {this.state.candidates.map((candidate, i) => {
                return (
                  <div className='panel panel-default' key={i}>
                    <div className='panel-body' ref='rows'>
                      <div className='row'>
                        <div className='col-md-10'>
                          <FormInput label='Name' horizontal={true} value={candidate} onChange={this.onChangeCandidate.bind(this, i)} />
                        </div>
                        <div className='col-md-2'>
                          <Button level='danger' size='sm' onClick={this.onRemoveCandidate.bind(this, i)}>Remove</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <Button level='primary' onClick={this.onAddCandidate.bind(this)} style={{ marginRight: '2em' }}>Add</Button>
          <Button level='success' onClick={this.update.bind(this)}>Save</Button>
          <Button level='link' onClick={this.props.onDone}>Cancel</Button>
        </div>
      </div>
    );
  }
}

class MotionFieldEditor extends Component {
  constructor(props) {
    super(props);

    this.state = this.props.field;
  }

  update() {
    const section = this.props.section;
    const field = this.props.index;
    const state = this.state;

    PollActions.updateField({ section, field, state });

    this.props.onDone();
  }

  onChange(e) {
    const { id, value } = e.target;
    const state = {};

    state[id] = value;

    this.setState(state);
  }

  componentDidMount() {
    $(findDOMNode(this.refs.first)).find('input').focus();
  }

  render() {
    return (
      <div style={{ padding: '1em', border: '1px solid gray' }}>
        <div className='row'>
          <div className='col-md-10 form form-horizontal'>
            <FormInput ref='first' label='Identifier' id='id' horizontal={true} value={this.state.id} onChange={this.onChange.bind(this)} />
            <FormInput label='Title' id='title' horizontal={true} value={this.state.title} onChange={this.onChange.bind(this)} />
            <FormTextarea label='Body' id='body' horizontal={true} value={this.state.body} rows='8' onChange={this.onChange.bind(this)} />
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

@DragSource(Types.FIELD, {
  beginDrag(props) {
    return {
      section: props.section,
      fieldId: props.fieldId,
      index: props.index
    };
  },
  isDragging(props, monitor) {
    return props.fieldId === monitor.getItem().fieldId;
  }
}, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
}))
@DropTarget(Types.FIELD, {
  canDrop: canDrop.bind(null, 'fieldId'),
  hover: hoverHandler.bind(null, 'moveField', (props, item) => ([
    props.section,
    item.fieldId,
    props.fieldId
  ]))
}, (connect) => ({
  connectDropTarget: connect.dropTarget()
}))
export default
class FieldEditor extends Component {
   constructor(props) {
     super(props);

     this.state = {
       editMode: props.field.isNew || false
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

  clickRemove() {
    PollActions.removeField({
      section: this.props.section,
      field: this.props.index
    });
  }

  renderElection() {
    const { field, isDragging, connectDragSource, connectDragPreview, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;

    const candidates = field.candidates || [];

    if (this.state.editMode) {
      return <ElectionFieldEditor index={this.props.index} section={this.props.section} field={this.props.field} onDone={this.clickCancel.bind(this)} />;
    } else {
      return connectDragPreview(connectDropTarget(
        <div className='panel panel-default' style={{ opacity }}>
          <div className='panel-heading'>
            <div className='pull-right'>
              <Button level='default' size='sm' onClick={this.clickEdit.bind(this)}>Edit</Button>
              <Button level='danger' size='sm' onClick={this.clickRemove.bind(this)}>&times;</Button>
            </div>
            {connectDragSource(<h3 className='panel-title'>{field.id}</h3>)}
          </div>
          <div className='panel-body'>
            <ul>
              {candidates.map((candidate, i) => {
                return <li key={i}>{candidate}</li>;
              })}
            </ul>
          </div>
        </div>
      ));
    }
  }

  renderMotion() {
    if (this.state.editMode) {
      return <MotionFieldEditor index={this.props.index} section={this.props.section} field={this.props.field} onDone={this.clickCancel.bind(this)}/>;
    } else {
      const { field, isDragging, connectDragSource, connectDragPreview, connectDropTarget } = this.props;
      const opacity = isDragging ? 0 : 1;

      return connectDragPreview(connectDropTarget(
        <div className='panel panel-default' style={{ opacity }}>
          <div className='panel-heading'>
            <div className='pull-right'>
              <Button level='default' size='sm' onClick={this.clickEdit.bind(this)}>Edit</Button>
              <Button level='danger' size='sm' onClick={this.clickRemove.bind(this)}>&times;</Button>
            </div>
            {connectDragSource(
            <h4 className='panel-title'>
              {field.title}
              <small style={{ marginLeft: '1em' }}>
                {field.id}
              </small>
            </h4>
            )}
          </div>

          <div className='panel-body'>
            <Markdown>{field.body}</Markdown>
          </div>
        </div>
      ));
    }
  }

  render() {
    if (this.props.type === 'election') {
      return this.renderElection();
    } else if (this.props.type === 'motion') {
      return this.renderMotion();
    } else {
      // No point setting up drag and drop for an error
      return (
        <div className='alert alert-danger'>
          Unknown type '{this.props.type}'!
        </div>
      );
    }
  }
}
