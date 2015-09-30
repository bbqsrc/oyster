import alt from '../alt';
import PollActions from '../actions/poll-actions';

import $ from 'jquery';

const PollSource = {
  fetchPoll() {
    return {
      remote() {
        return Promise.resolve({
          pageTitle: 'Test Page Title',
          title: 'Title',
          info: `## Markdown

          **Fuck** yeah.`,
          sections: [
            {}, {}, {}
          ]
        });
      },

      local() {
        return null;
      },

      success: PollActions.updatePoll,
      loading: PollActions.fetchPoll
    };
  }
};

class PollStore {
  static name: 'PollStore'

  constructor() {
    Object.assign(this, {
      pageTitle: '',
      title: '',
      info: '',
      sections: []
    });

    this.bindListeners({
      handleFetchPoll: PollActions.FETCH_POLL,
      handleUpdatePoll: PollActions.UPDATE_POLL,
      handleUpdatePageTitle: PollActions.UPDATE_PAGE_TITLE,
      handleUpdateTitle: PollActions.UPDATE_TITLE,
      handleUpdateInfo: PollActions.UPDATE_INFO,
      handleAddNewSection: PollActions.ADD_NEW_SECTION,
      handleRemoveSection: PollActions.REMOVE_SECTION
    });

    this.exportAsync(PollSource);

    this.on('afterEach', (o) => {
      const { payload, state } = o;
      /*
      if (!o) {
        console.log("Ain't nuffin but.");
        return;
      }


      $.ajax('/alt-test', {
        method: 'put',
        data: state
      });
      */

      //console.log(payload, state);
    });
  }

  handleFetchPoll() {
    // noop
  }

  handleUpdatePoll(poll) {
    Object.assign(this, poll);
  }

  handleUpdatePageTitle(pageTitle) {
    this.pageTitle = pageTitle;
  }

  handleUpdateTitle(title) {
    this.title = title;
  }

  handleUpdateInfo(info) {
    this.info = info;
  }

  handleAddNewSection() {
    this.sections.push({});
  }

  handleRemoveSection(index) {
    this.sections.splice(index, 1);
  }
}

export default alt.createStore(PollStore, PollStore.name);
