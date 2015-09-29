import { Component } from 'react';
import TOML from 'toml';

function validateTOML(data) {
  try {
    TOML.parse(data);
    return true;
  } catch (err) {
    return err;
  }
}

export default class TomlValidator extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: validateTOML(props.source)
    };
  }

  componentWillUpdate(nextProps) {
    if (nextProps.source !== this.props.source) {
      const result = validateTOML(nextProps.source);

      this.setState({ result });

      if (this.props.onChange) {
        this.props.onChange(result === true);
      }
    }
  }

  render() {
    if (this.state.result === true) {
      return <div className='alert alert-success toml-valid'>{this.props.validMessage || 'OK'}</div>;
    } else {
      const err = this.state.result;
      const msg = `Parsing error on line ${err.line}, column ${err.column}: ${err.message}`;

      return <div className='alert alert-danger toml-invalid'>{msg}</div>;
    }
  }
}
