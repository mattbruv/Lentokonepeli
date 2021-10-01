import React from "react";

import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";

import Polyglot from "node-polyglot";
import Cookies from "js-cookie";

import Header from "./Header";
import Home from "./Home";
import About from "./About";
import { SocketConnection } from "./socket";
import { Languages } from "./lang";
import { APIPacketOut, APIPacketOutType, ServerInfo } from "lento-gui";

/*
  This socket connection has to be defined outside of the
  react component.
  If it's a member of the class it makes double connections
  and all kinds of weird behavior.
*/
const api = new SocketConnection("ws://localhost:8080");

type AppState = {
  lang: Polyglot;
  servers: ServerInfo[];
}

export default class App extends React.Component<{}, AppState> {

  state = {
    lang: new Polyglot({
      allowMissing: true
    }),
    servers: []
  };

  constructor(props: {}) {
    super(props);

    api.socket.onmessage = (ev) => {
      const packet: APIPacketOut = JSON.parse(ev.data);
      switch (packet.type) {
        case APIPacketOutType.SERVER_INFO: {
          this.setState({ servers: packet.servers });
          break;
        }
      }
    }

    api.socket.onopen = (ev) => {
    }

  }

  async updateLang(lang: string) {
    const val = await fetch("/lang/" + lang + ".json");
    const data = await val.json();
    const p = new Polyglot();
    p.extend(data);
    p.extend({ lang });
    this.setState({ lang: p })
    Cookies.set("lang", lang);
  }

  componentDidMount() {
    const browserLang = navigator.language.substring(0, 2);
    let defaultLang = "en";

    if (Languages.map((lang) => lang.tag).includes(browserLang)) {
      defaultLang = browserLang;
    }

    defaultLang = Cookies.get("lang") || defaultLang;

    this.updateLang(defaultLang);
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
              <Home servers={this.state.servers} lang={this.state.lang} />
              {/* elysia */}
            </Route>
          </Switch>
        </div>
      </Router>
    );
  }
}
