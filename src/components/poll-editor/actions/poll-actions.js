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
}

export default alt.createActions(PollActions);
