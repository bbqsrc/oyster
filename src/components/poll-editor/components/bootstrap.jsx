import { Component } from 'react';

export class FormGroup extends Component {
  render() {
    return (
      <div className='form-group'>
        <label htmlFor={this.props.id} className='control-label'>
          {this.props.label}
        </label>
        {this.props.children}
      </div>
    );
  }
}

export class FormInput extends Component {
  render() {
    return (
      <FormGroup id={this.props.id} label={this.props.label}>
        <input {...this.props} className={`form-control ${this.props.className || ''}`.trim()}/>
      </FormGroup>
    );
  }
}

export class FormTextarea extends Component {
  render() {
    return (
      <FormGroup id={this.props.id} label={this.props.label}>
        <textarea {...this.props} className={`form-control ${this.props.className || ''}`.trim()} />
      </FormGroup>
    );
  }
}

export class Button extends Component {
  render() {
    return (
      <button
        type={this.props.type || 'button'}
        className={`btn btn-${this.props.level || 'default'}`}
        onClick={this.props.onClick}
      >{this.props.children}</button>
    );
  }
}
