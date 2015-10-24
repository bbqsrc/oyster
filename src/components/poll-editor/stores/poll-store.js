import alt from '../alt';
import update from 'react-addons-update';
import PollActions from '../actions/poll-actions';

const mockData = {
  _id: {
    str: '55b81c29682e676931f36bc4'
  },
  slug: 'congress-2015',
  title: 'National Congress 2015',
  startTime: '2015-07-29T07:00:00.000Z',
  endTime: '2015-08-04T00:55:53.751Z',
  content: {
    sections: [
          {
            fields: [
                  {
                    body: 'As per Article 9.1(3) of the Party Constitution, members must vote on whether to raise the quorum for constitutional amendments by 2%, from 18% to 20%.\n\nDo you agree to raise the quorum by 2%, to 20%?\n',
                    title: 'CAP-0: Raising the quorum for constitutional amendments',
                    id: 'CAP-0'
                  },
                  {
                    body: 'Principles:\n\nParagraph 3, sentence 1: Change “International” to “international”',
                    title: 'CAP-1: Principles Grammar',
                    id: 'CAP-1'
                  },
                  {
                    body: 'Article 3.1(4):\n\nChange:\n\n> * The quorum for any motion to accept the minutes of a previous meeting is set at the number of Councillors who attended that meeting. All Councillors absent from the previous meeting abstain by default.\n\nto:\n\n> - The quorum for any motion to accept the minutes of a previous meeting is set at the minimum to achieve a two-thirds majority of those present. All Councillors absent from the previous meeting abstain by default.',
                    title: 'CAP-4A: National Council Minutes Quorum',
                    id: 'CAP-4A'
                  },
                  {
                    body: 'Article 4.2.1(1)(e):\n\nChange:\n\n> - Participate in working groups defined by the National Council or any organ of the Party; and\n\nto:\n\n> - Where eligible, participate in working groups defined by the National Council or any organ of the Party; and',
                    title: 'CAP-6: Articles Grammar D',
                    id: 'CAP-6'
                  },
                  {
                    body: 'Article 9.4(3):\n\nChange:\n\n> - If such an amendment does not receive the necessary majority as stipulated at Article 9.1, then such a proposed amendment will lapse and may only be resurrected by a majority vote of the members at a National Congress.\n\nto:\n\n> - If such an amendment does not receive the necessary majority as stipulated at Article 9.1, then such a proposed amendment will lapse and the National Council may not use their powers to resurrect the provisions again without an amendment proposal being put to the National Congress.',
                    title: 'CAP-7: Articles Grammar E',
                    id: 'CAP-7'
                  },
                  {
                    body: 'Article 10.1(5):\n\nChange:\n\n> - No more than one National Council position may be filled by one member, except in cases where a position is subject to a temporary vacancy and pending a permanent appointment.\n\nto:\n\n> - No more than one National Council position may be filled by one member, except in cases where a position is subject to a temporary vacancy and pending a permanent appointment. In any case, no member of the National Council may cast more than one vote in any motion before the National Council.',
                    title: 'CAP-8: Articles Grammar F',
                    id: 'CAP-8'
                  },
                  {
                    body: '- Remove Article 11(2).\n- Article 11(3):\n\nChange:\n\n> Without limiting Article 11(2), it is further expressly intended\n\nto:\n\n> It is expressly intended\n\n- Change numbering of Article 11(3) and (4) to (2) and (3)',
                    title: 'CAP-9: Remove legal binding provisions',
                    id: 'CAP-9'
                  },
                  {
                    body: 'Article 12(1):\n\nAdd 12(1)(a):\n\n> - If any committee members, elected at a previous Congress, have not completed serving their term by the end of the congress, their position will not be considered up for reelection, and the number of members to be elected will be reduced accordingly.',
                    title: 'CAP-10: Dispute Resolution Committee term clarification',
                    id: 'CAP-10'
                  },
                  {
                    body: 'Article 12(5):\n\nAdd 12(5)(a):\n\n> - This section does not apply if a policy or bylaw that would prevent referral to the DRC is the policy or bylaw being disputed.',
                    title: 'CAP-11: DRC referral protection',
                    id: 'CAP-11'
                  },
                  {
                    body: '* Repeal By-law 2013-01.\n* Substitute Article 9.1(2) with:\n\n> - Members must be notified by email of any proposals for amendments by 11:59pm AEST of the 28th day before the first day of the National Congress.\n> - Article 9.1(2) can be fulfilled by placement of the proposals at a specified place on the Party website or wiki before the specified deadline and informing the membership of their location.\n\n* Insert paragraph at end of Article 9.1:\n\n> - New proposals may not be added after the deadline specified in Article 9.1(2), but already proposed amendments may be modified by the proposer prior to the National Congress, so long as:\n>   - These modifications do not substantially change the proposed amendments but may include updates in wording for clarity, or to correct errors; and\n>   - These modifications are recorded and justified.',
                    title: 'CAP-13: Incorporate by-law 2013-03',
                    id: 'CAP-13'
                  }
            ],
            info: '####Documentation\n\nThe rationale for the _unamended versions_ of the proposals below can be found [here](http://pirateparty.org.au/wiki/Pirate_Congress_2015/Constitutional_Amendments) and further justification and discussion can be found in the [minutes](http://pirateparty.org.au/wiki/Pirate_Congress_2015/Minutes).\n\n#### Information\n\nCAP-2, CAP-5 and CAP-12 lapsed on the floor, while CAP-3 and CAP-14 were referred to the Constitutional Review Committee, and are not shown below.\n',
            title: 'Constitutional Amendment Proposals',
            threshold: 'two-thirds',
            type: 'motion'
          },
          {
            fields: [
                  {
                    body: 'Accept [the proposed Distributed Digital Currencies and Economies policy](https://pirateparty.org.au/wiki/Distributed_Digital_Currencies_and_Economies_Policy_2015_proposal).',
                    title: 'PM-1: Distributed Digital Currencies and Economies',
                    id: 'PM-1'
                  },
                  {
                    body: 'Replace the existing Digital Liberties policy with [the proposed Digital Liberties policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Digital_Liberties_Update).',
                    title: 'PM-2: Digital Liberties',
                    id: 'PM-2'
                  },
                  {
                    body: 'Accept [the proposed Cultural policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Cultural_Policy).',
                    title: 'PM-3: Cultural Policy',
                    id: 'PM-3'
                  },
                  {
                    body: 'Replace the existing Foreign Policy and Treaty Making policy with [the proposed Foreign Policy and Treaty Making policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Foreign_Policy_and_Treaty_Making_Update).',
                    title: 'PM-4: Foreign policy and treaty making',
                    id: 'PM-4'
                  },
                  {
                    body: 'Accept [the proposed Health Policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Health_Policy)',
                    title: 'PM-5: Health',
                    id: 'PM-5'
                  },
                  {
                    body: 'Replace the existing Energy, Environment and Climate Change policy with [the proposed Energy, Environment and Climate Change policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Energy,_Environment_and_Climate_Change_Update).',
                    title: 'PM-6: Energy, Environment and Climate Change',
                    id: 'PM-6'
                  },
                  {
                    body: 'Replace the existing Education Policy with [the proposed Education Policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Education_Update).',
                    title: 'PM-7: Education',
                    id: 'PM-7'
                  },
                  {
                    body: 'Replace the existing Civil Liberties policy with [the proposed Civil Liberties policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Civil_Liberties_Update).',
                    title: 'PM-8: Civil Liberties',
                    id: 'PM-8'
                  },
                  {
                    body: 'Replace the existing Tax and Welfare policy with [the proposed Tax and Welfare policy](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Tax_and_Welfare_Update).',
                    title: 'PM-9: Tax and Welfare',
                    id: 'PM-9'
                  },
                  {
                    body: 'Replace the existing \'Declaration of platform and principles\' with [the proposed \'Declaration of platform and principles\'](https://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions/Policy_and_Platform/Declaration_of_Principles_Update).',
                    title: 'PM-10: Declaration of platform and principles',
                    id: 'PM-10'
                  }
            ],
            info: '####Documentation\n\nThe rationale and discussion for the proposals below can be found [here](http://pirateparty.org.au/wiki/Pirate_Congress_2015/Motions)\n',
            title: 'Policy Motions',
            threshold: 'two-thirds',
            type: 'motion'
          },
          {
            fields: [
                  {
                    candidates: [
                      'Michael Keating',
                      'Tom Randle'
                    ],
                    id: 'Deputy President'
                  },
                  {
                    candidates: [
                      'Daniel Judge',
                      'Fletcher Boyd'
                    ],
                    id: 'Secretary'
                  },
                  {
                    candidates: [
                      'Daniel Judge',
                      'Peter Fulton',
                      'Fletcher Boyd',
                      'Tom Randle'
                    ],
                    id: 'Deputy Secretary'
                  },
                  {
                    candidates: [
                      'Ben McGinnes',
                      'Tom Randle'
                    ],
                    id: 'Deputy Treasurer'
                  },
                  {
                    candidates: [
                      'Adien Treleaven',
                      'Daniel Judge',
                      'Fletcher Boyd',
                      'Peter Fulton',
                      'Tom Randle',
                      'Ben McGinnes'
                    ],
                    winners: 2,
                    id: 'Councillor (2)'
                  }
            ],
            info: '####Documentation\n\nCandidate nomination biographies can be found [here](http://pirateparty.org.au/wiki/Pirate_Congress_2015/Nominations).\n\n#### Information\n\nPlease rank the candidates. The voting method in use for this section is the [Schulze condorcet preferential voting method](https://en.wikipedia.org/wiki/Schulze_method).\n\nThis is similar to the House of Representatives voting system used in Australia, except you may rank candidates equally (ie, with the same number) and may choose to leave fields blank. Leaving a field blank means you wish to rank those candidates equal last.\n\n**Whole numbers (integers) greater than 0 only. Candidates should be ranked in ascending order (1, 2, 3, etc). The order of the candidates has been randomised.**\n\nUncontested positions are not listed below.\n',
            title: 'National Council and Dispute Resolution Committee Elections',
            method: 'schulze',
            type: 'election'
          }
    ],
    info: '#### Introduction\n\nBelow is a ballot for voting on 10 constitutional amendment proposals and 10 policy motions, followed by the National Council elections.\n\nMembers may vote for or against the motions being put. There is also an option to abstain, which will not be recorded as an aye or a nay.\n\n**It is safe to click links as they will all open in a new tab or window automatically.**\n\n**You may opt to abstain from any or all motions or elections. If no choice is made, an abstention will automatically be recorded.**\n\n#### Documentation\n\nThe minutes for the National Congress 2015 can be found [here](http://pirateparty.org.au/wiki/Pirate_Congress_2015/Minutes).\n\n#### Need help?\n\nIf you have any issues with this ballot, you may contact the [Internal Elections Working Group](mailto:iewg@pirateparty.org.au).\n',
    title: 'National Congress 2015',
    pageTitle: 'Pirate Congress 2015 | Pirate Party'
  },
  hasResults: false,
  email: {
    from: 'Internal Elections Working Group <iewg@pirateparty.org.au>',
    subject: 'Pirate Congress 2015 - Voting Ballot (Deadline: 5 August, 6pm AEST)',
    content: 'Dear member,\r\n\r\nPlease use the following link to vote on proposed policies, constitutional amendments, and to elect the National Council.\r\n\r\nDo not share this link: if someone else uses it, you will not be able to vote yourself. This is a secret ballot, meaning no one will be able to link you to your vote.\r\n\r\nYour unique link:\r\n\r\n{url}\r\n\r\nThe voting period will begin immediately and finish 6pm AEST, Wednesday, 5 August, 2015.\r\n\r\n--\r\nRegards,\r\n\r\nInternal Elections Working Group'
  },
  participantGroups: [
    'All Full Members 2015'
  ],
  isPublic: true,
  __v: 1237
};

const PollSource = {
  fetchPoll() {
    return {
      remote() {
        return Promise.resolve(mockData);
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
      sections: [],
      isNew: true
    });

    this.bindListeners({
      handleFetchPoll: PollActions.FETCH_POLL,
      handleUpdatePoll: PollActions.UPDATE_POLL,
      handleUpdatePageTitle: PollActions.UPDATE_PAGE_TITLE,
      handleUpdateTitle: PollActions.UPDATE_TITLE,
      handleUpdateInfo: PollActions.UPDATE_INFO,
      handleAddNewSection: PollActions.ADD_NEW_SECTION,
      handleRemoveSection: PollActions.REMOVE_SECTION,
      handleMoveSection: PollActions.MOVE_SECTION,
      handleUpdateSection: PollActions.UPDATE_SECTION,
      handleNewFieldForSection: PollActions.NEW_FIELD_FOR_SECTION,
      handleUpdateField: PollActions.UPDATE_FIELD,
      handleRemoveField: PollActions.REMOVE_FIELD,
      handleMoveField: PollActions.MOVE_FIELD,
      handleUpdateBaseProperties: PollActions.UPDATE_BASE_PROPERTIES,
      handleNewPoll: PollActions.NEW_POLL
    });

    this.exportAsync(PollSource);

    this.exportPublicMethods({
      newPoll: this.handleNewPoll
    });
  }

  handleFetchPoll() {
    // noop
  }

  handleUpdatePoll(poll) {
    Object.assign(this, poll.content);
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
    this.sections.push({
      title: '',
      info: '',
      fields: [],
      isNew: true
    });
  }

  handleRemoveSection(index) {
    this.sections.splice(index, 1);
  }

  findSectionIndex(sectionTitle) {
    return this.sections.findIndex(section => section.title === sectionTitle);
  }

  handleMoveSection(o) {
    const [dragIndex, hoverIndex] = o.map(this.findSectionIndex.bind(this));
    const dragSection = this.sections[dragIndex];

    this.sections = update(this.sections, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragSection]
      ]
    });
  }

  handleUpdateSection(o) {
    const { section, state } = o;
    const node = this.sections[section];

    Object.assign(node, state);
    node.isNew = false;
  }

  handleNewFieldForSection(index) {
    this.sections[index].fields.push({
      isNew: true
    });
  }

  handleUpdateField(o) {
    const { section, field, state } = o;

    const node = this.sections[section].fields[field];

    Object.assign(node, state);
    node.isNew = false;
  }

  handleRemoveField(o) {
    const { section, field } = o;

    delete this.sections[section].fields[field];
  }

  findFieldIndex(sectionIndex, fieldId) {
    return this.sections[sectionIndex].fields.findIndex(field => field.id === fieldId);
  }

  handleMoveField(o) {
    const [sectionIndex, ...fieldIds] = o;
    const [dragIndex, hoverIndex] = fieldIds.map(
      this.findFieldIndex.bind(this, sectionIndex)
    );

    const sectionFields = this.sections[sectionIndex].fields;

    const dragField = sectionFields[dragIndex];

    this.sections[sectionIndex].fields = update(sectionFields, {
      $splice: [
        [dragIndex, 1],
        [hoverIndex, 0, dragField]
      ]
    });
  }

  handleUpdateBaseProperties(o) {
    Object.assign(this, o);
    this.isNew = false;
  }

  handleNewPoll() {
    Object.assign(this, {
      pageTitle: '',
      title: '',
      info: '',
      sections: [],
      isNew: true
    });
  }
}

export default alt.createStore(PollStore, PollStore.name);
