import { Component } from 'react';

import { findDOMNode } from 'react-dom';

import { DragSource, DropTarget, DragDropContext } from 'react-dnd';

import HTML5Backend from 'react-dnd-html5-backend';

import AltContainer from 'alt/AltContainer';

import PollStore from './stores/poll-store';
import PollActions from './actions/poll-actions';

import Markdown from './components/markdown';
import BasePropertiesEditor from './components/base-properties-editor';
import { Controls, Button, FormInput, FormTextarea, FormSelect } from './components/bootstrap';

import $ from 'jquery';

const Types = {
  SECTION: Symbol('Section'),
  FIELD: Symbol('Field')
};

function canDrop(propName, props, monitor) {
  const dragId = monitor.getItem()[propName];
  const hoverId = props[propName];

  if (dragId === hoverId) {
    // Over self, can't drop here
    return false;
  }

  return true;
}

function hoverHandler(actionName, actionParamGetter, props, monitor, component) {
  // Index of the item being dragged
  const dragIndex = monitor.getItem().index;
  // Index of the item being hovered over
  const hoverIndex = props.index;

  if (!monitor.canDrop()) {
    // Not a valid target, do nothing
    return;
  }

  // Bounding box for the item being hovered over
  const hoverBounds = findDOMNode(component).getBoundingClientRect();

  // Vertical midpoint of the item being hovered over
  const hoverMiddleY = (hoverBounds.bottom - hoverBounds.top) / 2;

  // Pointer coordinates
  const clientOffset = monitor.getClientOffset();

  // Determine how far the pointer is from the top of the hovered element
  const hoverClientY = clientOffset.y - hoverBounds.top;

  // Dragging down
  if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
    // Not past vertical midpoint yet, do nothing
    return;
  }

  // Dragging up
  if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
    // Not past vertical midpoint yet, do nothing
    return;
  }

  // Invoke the action with parameters from getter (func of props & item)
  props[actionName](...actionParamGetter(props, monitor.getItem()));
}

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
          <Button level='primary' onClick={this.onAddCandidate.bind(this)} style={{marginRight: '2em'}}>Add</Button>
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
      )
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

class Sections extends Component {
  render() {
    return (
      <div>
        <AltContainer store={PollStore} actions={PollActions}>
          {this.props.sections.map((section, i) => {
            return <Section key={i} index={i} section={section} sectionTitle={section.title} />;
          })}
        </AltContainer>
      </div>
    );
  }
}

@DragDropContext(HTML5Backend)
export default
class App extends Component {
  componentDidMount() {
    PollStore.fetchPoll();

    // Hijack links.
    $(this.refs.container.getDOMNode()).on('click', 'a', e => {
      e.preventDefault();
      return false;
    });

    $(this.refs.container.getDOMNode()).popover({
      trigger: 'click',
      selector: 'a[href]',
      placement: 'auto top',
      content: 'Clicking links blocked.'
    })
  }

  componentWillUnmount() {
    $(this.refs.containers).off('click', 'a');
  }

  render() {
    return (
      <AltContainer ref='container' store={PollStore} actions={PollActions}>
        <header className='page-header'>

          <div className='label label-danger' style={{ fontSize: '1em' }}>Early Prototype</div>
          <h1>Poll Editor</h1>
        </header>
        <BasePropertiesEditor />

        <Controls>
          <Button level='primary' onClick={PollActions.addNewSection}>
            Add new section
          </Button>
        </Controls>

        <Sections />
      </AltContainer>
    );
  }
}
