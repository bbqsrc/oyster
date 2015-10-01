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
      <div style={{ 'padding': '1em', 'border': '1px solid gray' }}>
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
    if (!this.props.children) {
      return <div/>;
    }

    try {
      return <div dangerouslySetInnerHTML={this.generate()} />;
    } catch (err) {
      return (
        <div>
          <div className='alert alert-danger'>{err}</div>
          <pre>
          </pre>
        </div>
      );
    }
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
  constructor(props) {
    super(props);

    this.state = this.props.section;
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

  render() {
    const section = this.props.section;

    return (
      <div>
        <div className='form form-horizontal row'>
          <div className='col-md-10'>
            <FormInput label='Section Title' data-id='title' id={`section-title-${this.props.index}`} value={this.state.title} horizontal={true} onChange={this.onChange.bind(this)} />

            <div className='form-group'>
              <label htmlFor={`section-type-${this.props.index}`} className='control-label col-md-2'>Section Type</label>
              <div className='col-md-10'>
                <p className="form-control-static">{section.type}</p>
              </div>
            </div>

            <FormTextarea label='Section Information' data-id='info' id={`section-info-${this.props.index}`} value={this.state.info} onChange={this.onChange.bind(this)} horizontal={true} rows='8' />
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

class Section extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false
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

  renderSectionHeader() {
    const section = this.props.section;

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
    const section = this.props.section;

    return (
      <div style={{ padding: '1em', border: '1px solid gray' }}>
        <Controls>
          <Button level='primary' onClick={this.props.newFieldForSection.bind(this, this.props.index)}>New field</Button>
          <div className='pull-right'>
            <Button level='danger' size='sm' onClick={this.props.removeSection.bind(this, this.props.index)}>&times;</Button>
          </div>
        </Controls>

        <div className='panel panel-default'>
          <div className='panel-body'>
            {this.renderSectionHeader()}

            <hr />

            <AltContainer store={PollStore} actions={PollActions}>
              {section.fields.map((field, i) => {
                return <FieldEditor section={this.props.index} type={section.type} field={field} key={i} index={i} />;
              })}
            </AltContainer>
          </div>
        </div>
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
            return <Section key={i} index={i} section={section} />;
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
