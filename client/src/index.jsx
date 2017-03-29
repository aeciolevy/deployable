import '../styles/main.scss';

import React from 'react';
import ReactDOM from 'react-dom';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    fetch('/profile', {credentials: 'same-origin'})
      .then(res => res.json())
      .then(user => this.setState({user}));
  }

  updateUser(event) {
    event.preventDefault();
    const email = this.userEmailField.value;
    const password = this.userPasswordField.value;
    fetch('/profile', {
      method: 'PUT',
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({email, password})
    }).then(() => {
      const user = Object.assign({}, this.state.user);
      user.email = email;
      this.setState({user});
    });
  }

  render() {
    return (
      <div>
        <p>
          <a href="/logout">Sign Out</a>
        </p>
        {this.state.user ? (
          <div>
            <p>Welcome, {this.state.user.email}</p>
            <form onSubmit={this.updateUser.bind(this)}>
              <p>
                <label htmlFor="profile-email">Email</label>{' '}
                <input id="profile-email" name="email" defaultValue={this.state.user.email} ref={el => this.userEmailField = el} />
              </p>
              <p>
                <label htmlFor="profile-password">New password</label>{' '}
                <input id="profile-password" type="password" name="password"ref={el => this.userPasswordField = el}  />
              </p>
              <p>
                <button>Update Profile</button>
              </p>
            </form>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('react-root'));
