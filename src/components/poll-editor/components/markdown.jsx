import { Component } from 'react';

import marked from 'marked';

export default
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
            {this.props.children}
          </pre>
        </div>
      );
    }
  }
}
