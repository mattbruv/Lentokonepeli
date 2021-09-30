import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import Polyglot from "node-polyglot";

import Header from "./Header";
import Home from "./Home";
import About from "./About";
import { SocketConnection } from "./socket";

/*
  This socket connection has to be defined outside of the
  react component.
  If it's a member of the class it makes double connections
  and all kinds of weird behavior.
*/
const api = new SocketConnection("ws://localhost:8080");

type AppState = {
  lang: Polyglot;
}

export default class App extends React.Component<{}, AppState> {

  state = {
    lang: new Polyglot({
      allowMissing: true
    })
  };

  constructor(props: {}) {
    super(props);

    api.socket.onmessage = (ev) => {
      console.log(ev.data);
      console.log(Date.now())
    }

    api.socket.onopen = (ev) => {
      console.log("connection open!");
      api.socket.send(ev.type);
    }

  }

  updateLang(lang: string) {
    fetch("/lang/" + lang + ".json")
      .then((val) => {
        return val.json()
      }).then((data) => {
        const lang = new Polyglot();
        lang.extend(data);
        this.setState({ lang });
      });
  }

  componentDidMount() {
    this.updateLang("en");
  }

  render() {
    return (
      <Router>
        <div className="App">
          <Header lang={this.state.lang}
            langUpdate={(lang) => { this.updateLang(lang) }}
          ></Header>
          {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
          <Switch>
            <Route path="/about">
              <About />
            </Route>
            <Route path="/">
              <Home />
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}
