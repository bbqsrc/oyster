import { Component } from 'react';

export class FormGroup extends Component {
  renderHorizontal() {
    // horizontal can be an int or true. True does default.
    const horizontal = this.props.horizontal === true
                          ? 2
                          : this.props.horizontal;
    const diff = 12 - horizontal;

    return (
      <div className='form-group'>
        <label htmlFor={this.props.id} className={`control-label col-md-${horizontal}`}>
          {this.props.label}
        </label>
        <div className={`col-md-${diff}`}>
          {this.props.children}
        </div>
      </div>
    );
  }

  render() {
    if (this.props.horizontal) {
      return this.renderHorizontal();
    }

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
      <FormGroup id={this.props.id} label={this.props.label} horizontal={this.props.horizontal}>
        <input {...this.props} className={`form-control ${this.props.className || ''}`.trim()}/>
      </FormGroup>
    );
  }
}

export class FormTextarea extends Component {
  render() {
    return (
      <FormGroup id={this.props.id} label={this.props.label} horizontal={this.props.horizontal}>
        <textarea {...this.props} className={`form-control ${this.props.className || ''}`.trim()} />
      </FormGroup>
    );
  }
}

export class FormSelect extends Component {
  render() {
    return (
      <FormGroup id={this.props.id} label={this.props.label} horizontal={this.props.horizontal}>
        <select {...this.props} className={`form-control ${this.props.className || ''}`.trim()}>
          {this.props.children}
        </select>
      </FormGroup>
    );
  }
}

export class Button extends Component {
  render() {
    const classes = ['btn'];

    if (this.props.level) {
      classes.push(`btn-${this.props.level}`);
    }

    if (this.props.size) {
      classes.push(`btn-${this.props.size}`);
    }

    return (
      <button
        style={{ marginRight: '.5em' }}
        type={this.props.type || 'button'}
        className={classes.join(' ')}
        onClick={this.props.onClick}
      >{this.props.children}</button>
    );
  }
}

export class Controls extends Component {
  render() {
    return (
      <div className='well'>
        {this.props.children}
      </div>
    );
  }
}
