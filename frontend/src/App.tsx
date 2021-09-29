import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

import Header from "./Header";
import Home from "./Home";
import About from "./About";

import { sayHello } from "lento-gui";

sayHello();

function App() {
  return (
    <Router>
      <div className="App">
        <Header message="test"></Header>
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

export default App;
