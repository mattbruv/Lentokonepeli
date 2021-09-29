import React from "react";
import { ServerList } from "./ServerList";
import { Game } from "./Game";
import { TestLib, sum } from "lento-gui";

export class Home extends React.Component {

    constructor(props) {
        super(props);

        console.log(sum(3, 4));

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
            // console.log(e);
            this.setState({ connected: true });
        }
    }

    componentWillUnmount() {
        if (this.state.connected) {
            if (this.gameSocket) {
                this.gameSocket.close();
            }
        }
    }

    renderGame() {
        return (
            <Game ws={this.gameSocket} />
        );
    }

    renderServers() {
        return (
            <ServerList
                joinCallback={(s) => { this.joinServer(s) }}
            />
        );
    }

    render() {
        return <div>
            test
            {/* 
            {this.state.connected ? this.renderGame() : this.renderServers()}
            */}
        </div>
    }
}