var
  request = require('superagent'),
  slug = require('slug'),
  React = require('react'),
  AppBar = require('material-ui/lib/app-bar'),
  LeftNav = require('material-ui/lib/left-nav'),
  Slider = require('material-ui/lib/slider'),
  FlatButton = require('material-ui/lib/flat-button');


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

}

var styles = {
  leftNav: {
    zIndex: 100,
    top: 60,
    padding: 20
  },
  entryList: {
    marginLeft: 200
  }
};

// Main component of the application
var App = React.createClass({
  render: function () {
    return (
      <div>
      <AppBar
        title="delter"
        showMenuIconButton={false}
        iconElementRight={<FlatButton label="Twitter" linkButton={true} href="/api/auth/twitter" />}
      />
      {/*<LeftNav style={styles.leftNav}>
        <Slider step={0.10} value={.5}/>
      </LeftNav>*/}
      <EntryList entries={this.props.entries}></EntryList>
      </div>
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
      <div style={styles.entryList}>
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
        <p class="title">
          <a href={this.props.url}>{this.props.title}</a>
        </p>
        <p class="user">
          <a href={this.props.user.home_url}>
            <img src={this.props.user.image_url} alt="profile_image" />
          </a>
        </p>
      </div>
    );
  }
});


// Start the application
// First we load the entries, then we give the result to React so it can render our app
data.getEntries(function (err, entries) {
  React.render(<App entries={entries.rows}></App>,
               document.getElementById('app'));
});
