import React from 'react';
import toml from 'toml';

const TomlValidator = React.createClass({
  render() {
    try {
      toml.parse(this.props.source);
      return <span className='toml-valid'>{this.props.validMessage || 'OK'}</span>;
    } catch(err) {
      let msg = 'Parsing error on line ' + err.line +
                ', column ' + err.column + ': ' + err.message;
      return <span className='toml-invalid'>{msg}</span>;
    }
  }
});

export { TomlValidator as default };
