import React from "react";
import { ServerList } from "./ServerList";


export class Home extends React.Component {

    constructor(props) {
        super(props);

        this.gameSocket = null;

        this.state = {
            connected: false
        };
    }

    joinServer(server) {

        console.log(server);
        const conn = "ws://" + server.ip + ":" + server.port;

        if (this.gameSocket) {
            this.gameSocket.close();
        }

        this.gameSocket = new WebSocket(conn);

        this.gameSocket.onopen = (e) => {
            console.log(e);
            this.setState({ connected: true });
        }
    }

    render() {
        return <div>
            {this.state.connected ? "true" : "false"}
            <ServerList joinCallback={(s) => this.joinServer(s)} />
        </div>
    }
}