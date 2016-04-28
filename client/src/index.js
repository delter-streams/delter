var
  request = require('superagent'),
  slug = require('slug'),
  React = require('react');

// helpers to request the server API
var data = {

  // get displayed entries based on the user's filtering options
  getEntries: function (callback) {
    request
      .get('/api/entries')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        callback(err, res.body);
      });
  },

  getIsAuthenticated: function (callback) {
    request
      .get('/api/is_authenticated')
      .set('Accept', 'application/json')
      .end(function (err, res) {
        callback(err, res.body);
      });
  },

}

// Main component of the application
var App = React.createClass({
  render: function () {
    return (
      <div>
      <h1>delter</h1>
      <TwitterIcon user={this.props.user}></TwitterIcon>
      <EntryList entries={this.props.entries}></EntryList>
      </div>
    )
  }
});

// Twitter link component
var TwitterIcon = React.createClass({
  render: function () {
    return (
      <a href={this.props.user.twitter.link_url}>
        {this.props.user.twitter.title}
      </a>
    )
  }
});


// Entry list component
var EntryList = React.createClass({

  // We define here the initial state of the component. Given entries
  // will become the "state" of the component.
  getInitialState: function () {
    return { entries: this.props.entries };
  },

  // Component rendering
  render: function () {

    // Here we build the entry component list.
    var entries = this.state.entries.map(function (entry) {
      return (
        <Entry title={entry.title} url={entry.url}
                  source={entry.source} user={entry.user}>
        </Entry>
      );
    });

    // Full render
    return (
      <div>
        {entries}
      </div>
    );
  }
});


// A simple component to describe our entry
var Entry = React.createClass({

  // Rendering of the component via a JSX template
  render: function () {
    return (
      <div>
        <a href={this.props.user.home_url}>
          <img src={this.props.user.image_url} alt="profile_image" class="profile-image" />
        </a>
        <a href={this.props.url}>{this.props.title}</a>
      </div>
    );
  }
});


// Start the application
// First we load the entries, then we give the result to React so it can render our app
data.getIsAuthenticated(function (err, res) {
  if (res.is_authenticated) {
    var user = {
      twitter: {
        link_url: "http://twitter.com/" + res.user.social.twitter.username,
        title: res.user.social.twitter.username
      }
    };
    data.getEntries(function (err, entries) {
      React.render(<App entries={entries.rows} user={user}></App>,
                   document.getElementById('app'));
    });
  } else {
    // not logged in -> return empty entry list
    var user = {
      twitter: {
        link_url: "/api/auth/twitter",
        title: "Twitter"
      }
    };
    React.render(<App entries={[]} user={user}></App>,
                 document.getElementById('app'));
  }
});
