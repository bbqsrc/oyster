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

  newPoll() {
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

  moveSection(dragTitle, hoverTitle) {
    this.dispatch([dragTitle, hoverTitle]);
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

  moveField(sectionIndex, dragId, hoverId) {
    this.dispatch([sectionIndex, dragId, hoverId]);
  }

  updateBaseProperties(o) {
    this.dispatch(o);
  }
}

export default alt.createActions(PollActions);
