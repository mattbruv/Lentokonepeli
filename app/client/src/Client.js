import React from "react";

class Client extends React.Component {

  ws = null

  constructor(props) {
    super(props);
    this.state = {
      connection: null
    };
  }

  componentDidMount() {
    this.ws = new WebSocket("ws://localhost:420");

    this.ws.onopen = () => {
      console.log("connected");
    }

    this.ws.onmessage = evt => {
      const message = evt.data;
      console.log(message);
    }

  }

  render() {
    return <b>Hello World!</b>;
  }
}

export default Client;
