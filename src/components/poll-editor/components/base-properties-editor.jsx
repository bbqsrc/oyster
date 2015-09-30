import { Component } from 'react';
import { FormInput, FormTextarea } from './bootstrap';

export default
class BasePropertiesEditor extends Component {
  passthrough(propName) {
    return event => this.props[propName](event.target.value);
  }

  render() {
    return (
      <div>
        <FormInput label='Page Title' id='pageTitle' value={this.props.pageTitle} onChange={this.passthrough('updatePageTitle')} />
        <FormInput label='Title' id='title' value={this.props.title} onChange={this.passthrough('updateTitle')} />
        <FormTextarea label='Info' id='info' value={this.props.info} onChange={this.passthrough('updateInfo')} />
      </div>
    );
  }
}
