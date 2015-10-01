import alt from '../alt';

class PollActions {
  updatePageTitle(pageTitle) {
    this.dispatch(pageTitle);
  }

  updateTitle(title) {
    this.dispatch(title);
  }

  updateInfo(info) {
    this.dispatch(info);
  }

  fetchPoll() {
    this.dispatch();
  }

  updatePoll(poll) {
    this.dispatch(poll);
  }

  addNewSection() {
    this.dispatch();
  }

  removeSection(index) {
    this.dispatch(index);
  }

  updateSection(o) {
    this.dispatch(o);
  }

  newFieldForSection(index) {
    this.dispatch(index);
  }

  updateField(state) {
    this.dispatch(state);
  }

  removeField(state) {
    this.dispatch(state);
  }
}

export default alt.createActions(PollActions);
