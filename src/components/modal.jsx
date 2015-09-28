import { Component } from 'react';

import $ from 'jquery';

export default
class Modal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      visible: false
    };
  }

  componentDidMount() {
    let m = $(React.findDOMNode(this));

    m.modal(this.props.options || { show: false });

    if (this.props.onShow) {
      m.on('show.bs.modal', this.props.onShow);
    }

    if (this.props.onHide) {
      m.on('hide.bs.modal', this.props.onHide);
    }

    this.$ = m;
  }

  onClick() {
    let shouldHide = true;

    if (this.props.onClick) {
      shouldHide = this.props.onClick();
      if (shouldHide == null) {
        shouldHide = true;
      }
    }

    if (shouldHide) {
      this.setState({
        visible: false
      });
    }
  }

  componentDidUnmount() {
    this.$.modal('hide').data('bs.modal', null);
    this.$.remove();
  }

  componentWillUpdate(nextProps) {
    // Check for change to visible prop
    if (nextProps.visible !== this.props.visible) {
      this.setState({
        visible: nextProps.visible
      });
    }
  }

  componentDidUpdate(_, prevState) {
    if (prevState.visible !== this.state.visible) {
      this.$.modal(this.state.visible ? 'show' : 'hide');
    }
  }

  isButtonEnabled() {
    return this.props.btnEnabled === undefined || this.props.btnEnabled;
  }

  render() {
    return (
      <div className='modal fade' id={this.props.id}>
        <div className={'modal-dialog ' + (this.props.size ? ('modal-' + this.props.size) : '')}>
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
              </button>
              <h4 className="modal-title">{this.props.title}</h4>
            </div>
            <div className="modal-body">
              {this.props.children}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-default" data-dismiss="modal">Close</button>
              <button type="button" disabled={!this.isButtonEnabled.bind(this)} className={'btn btn-' + (this.props.btnClass || 'primary')} onClick={this.onClick.bind(this)} >
                {this.props.btnText}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
