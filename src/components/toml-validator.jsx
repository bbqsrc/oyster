import { Component } from 'react';
import toml from 'toml';

export default class TomlValidator extends Component {
  render() {
    try {
      toml.parse(this.props.source);
      return <div className='alert alert-success toml-valid'>{this.props.validMessage || 'OK'}</div>;
    } catch(err) {
      let msg = 'Parsing error on line ' + err.line +
                ', column ' + err.column + ': ' + err.message;
      return <div className='alert alert-danger toml-invalid'>{msg}</div>;
    }
  }
}
