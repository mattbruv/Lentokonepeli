import React from "react";

class Client extends React.Component {
  ws = null;

  constructor(props) {
    super(props);
    this.state = {
      data: null,
    };
  }

  componentDidMount() {
    this.ws = new WebSocket("ws://localhost:6969");

    this.ws.onopen = () => {
      console.log("connected");
    };

    this.ws.onmessage = (evt) => {
      const message = evt.data;
      console.log(message);
    };
  }

  updateText(value) {
    this.setState({ data: value });
  }

  sendData() {
    this.ws.send(this.state.data);
  }

  render() {
    return (
      <div>
        <input type="text" onChange={(e) => this.updateText(e.target.value)} />{" "}
        <input
          type="Button"
          onClick={() => this.sendData()}
          readOnly
          value="Send"
        />
        <br />
        {this.state.data}
      </div>
    );
  }
}

export default Client;
