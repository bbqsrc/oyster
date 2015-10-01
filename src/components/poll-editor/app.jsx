import { Component } from 'react';
import AltContainer from 'alt/AltContainer';

import PollStore from './stores/poll-store';
import PollActions from './actions/poll-actions';

import BasePropertiesEditor from './components/base-properties-editor';
import { Button, FormInput, FormTextarea } from './components/bootstrap';

import marked from 'marked';

class MotionFieldEditor extends Component {
  constructor(props) {
    super(props);

    this.state = this.props.field;
  }

  update() {
    const section = this.props.section;
    const field = this.props.index;
    const state = this.state;

    console.log(section, field, state);

    PollActions.updateField({ section, field, state });

    this.props.onDone();
  }

  onChange(e) {
    const { id, value } = e.target;
    const state = {};

    state[id] = value;

    this.setState(state);
  }

  render() {
    return (
      <div style={{ margin: '1em', 'padding': '1em', 'border': '1px solid gray' }}>
        <div className='row'>
          <div className='col-md-10 form form-horizontal'>
            <FormInput label='Identifier' id='id' horizontal={true} value={this.state.id} onChange={this.onChange.bind(this)} />
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

class Markdown extends Component {
  generate() {
    return {
      __html: marked(this.props.children)
    };
  }

  render() {
    return (
      <div dangerouslySetInnerHTML={this.generate()} />
    );
  }
}

class Controls extends Component {
  render() {
    return (
      <div className='well'>
        {this.props.children}
      </div>
    );
  }
}

class FieldEditor extends Component {
   constructor(props) {
     super(props);

     this.state = {
       editMode: false
     };
   }

  renderElection() {
    const field = this.props.field;

    return <div/>;
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

  renderMotion() {
    if (this.state.editMode) {
      return <MotionFieldEditor index={this.props.index} section={this.props.section} field={this.props.field} onDone={this.clickCancel.bind(this)}/>;
    } else {
      const field = this.props.field;

      return (
        <div className='panel panel-default'>
          <div className='panel-heading'>
            <div className='pull-right'>
              <Button level='default' size='sm' onClick={this.clickEdit.bind(this)}>Edit</Button>
              <Button level='danger' size='sm' onClick={this.clickRemove.bind(this)}>&times;</Button>
            </div>
            <h4 className='panel-title'>
              {field.title}
              <small style={{ marginLeft: '1em' }}>
                {field.id}
              </small>
            </h4>
          </div>

          <div className='panel-body'>
            <Markdown>{field.body}</Markdown>
          </div>
        </div>
      );
    }
  }

  render() {
    if (this.props.type === 'election') {
      return this.renderElection();
    } else if (this.props.type === 'motion') {
      return this.renderMotion();
    } else {
      return (
        <div className='alert alert-danger'>
          Unknown type '{this.props.type}'!
        </div>
      );
    }
  }
}

class SectionEditor extends Component {
  render() {
    const section = this.props.section;

    return (
      <div style={{ margin: '1em', padding: '1em', border: '1px solid gray' }}>
        <Controls>
          <Button level='primary' onClick={this.props.newFieldForSection.bind(this, this.props.index)}>New field</Button>
          <div className='pull-right'>
            <Button level='danger' size='sm' onClick={this.props.removeSection.bind(this, this.props.index)}>&times;</Button>
          </div>
        </Controls>
        <div className='row'>
          <div className='form form-horizontal col-md-10'>
            <FormInput label='Section Title' id={`section-title-${this.props.index}`} value={section.title} horizontal={true} />
            <div className='form-group'>
              <label htmlFor={`section-type-${this.props.index}`} className='control-label col-md-2'>Section Type</label>
              <div className='col-md-10'>
                <p className="form-control-static">{section.type}</p>
              </div>
            </div>
            <FormTextarea label='Section Information' id={`section-info-${this.props.index}`} value={section.info} horizontal={true} rows='8' />
          </div>
        </div>
        <AltContainer store={PollStore} actions={PollActions}>
          {section.fields.map((field, i) => {
            return <FieldEditor section={this.props.index} type={section.type} field={field} key={i} index={i} />;
          })}
        </AltContainer>
      </div>
    );
  }
}

class Sections extends Component {
  render() {
    return (
      <div>
        <AltContainer store={PollStore} actions={PollActions}>
          {this.props.sections.map((section, i) => {
            return <SectionEditor key={i} index={i} section={section} />;
          })}
        </AltContainer>
      </div>
    );
  }
}

export default
class App extends Component {
  componentDidMount() {
    PollStore.fetchPoll();
  }

  render() {
    return (
      <AltContainer store={PollStore} actions={PollActions}>
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
