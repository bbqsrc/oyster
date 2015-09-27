import { Component } from 'react';

export default class PollSettings extends Component {
  render() {
    return (
      <div className='col-md-4 col-settings'>
        <h2>Settings</h2>

        <table className='table'>
          <tr>
            <th>Make public?</th>
            <td>
              <input type='checkbox' />
            </td>
          </tr>
          <tr>
            <th>Test ballot requires authentication?</th>
            <td>
              <input type='checkbox' />
            </td>
          </tr>
        </table>
      </div>
    );
  }
}
