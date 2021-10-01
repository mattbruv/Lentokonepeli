import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";
import ServerList from "./ServerList";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { SocketConnection } from "./socket";
import { GameClient } from "lento-gui/lib/client";

type HomeProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

let gameSocket: SocketConnection;

type HomeState = {
    gameConnection: boolean
    gameClient: GameClient
}

export default class Home extends React.Component<HomeProps, HomeState> {

    state = {
        gameConnection: false,
        gameClient: new GameClient(),
    }

    closeGameSocket() {
        if (gameSocket && gameSocket.socket.OPEN) {
            gameSocket.socket.close();
        }
    }

    leaveServer() {
        this.closeGameSocket();
        this.setState({ gameConnection: false });
    }

    joinServer(url: string) {

        console.log("joining server " + url);
        gameSocket = new SocketConnection(url);

        gameSocket.socket.onopen = (ev) => {
            console.log("connected!");
            this.setState({ gameConnection: true }, () => {
                this.state.gameClient.initialize("assets/images/images.json", "#gameCanvas")
            });
        };

        gameSocket.socket.onclose = (ev) => {
        };
    }

    componentWillUnmount() {
        this.closeGameSocket();
    }

    renderServers() {
        return (
            <Container fluid="md">
                <Row className="justify-content-md-center">
                    <Col sm={8}>
                        <ServerList
                            joinServerCB={(url) => this.joinServer(url)}
                            servers={this.props.servers}
                            lang={this.props.lang}
                        />
                    </Col>
                </Row>
            </Container>
        )
    }

    renderGame() {
        return (
            <div>
                <Button
                    onClick={() => this.leaveServer()}
                    variant="danger">Leave</Button>
                <div id="gameCanvas"></div>
            </div>
        );
    }

    render() {
        return (this.state.gameConnection) ? this.renderGame() : this.renderServers();
    }
}