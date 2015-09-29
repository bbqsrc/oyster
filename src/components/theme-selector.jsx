import { Component } from 'react';

import $ from 'jquery';

export default
class ThemeSelector extends Component {
  constructor(props) {
    super(props);

    this.state = {
      options: []
    };
  }

  componentDidMount() {
    const self = this;

    $.get('/api/themes', res => {
      self.setState({
        options: res.themes
      });
    });
  }

  render() {
    return (
      <select {...this.props} readonly={this.state.length === 0}>
        {this.state.options.length ? this.state.options.map(opt => {
          return <option value={opt}>{opt}</option>;
        }) : <option>Loading...</option>}
      </select>
    );
  }
}
