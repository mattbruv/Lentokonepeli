import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";
import ServerList from "./ServerList";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { SocketConnection } from "./socket";
import { GameClient, loadResources } from "lento-gui/lib/client";

type HomeProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

let gameSocket: SocketConnection;
let gameClient: GameClient;

type HomeState = {
    gameConnection: boolean
}

export default class Home extends React.Component<HomeProps, HomeState> {

    state = {
        gameConnection: false
    }

    constructor(props: HomeProps) {
        super(props);
        loadResources("assets/images/images.json");
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
                gameClient = new GameClient();
                gameClient.appendCanvas("#gameCanvas");
            });
        };

        gameSocket.socket.onmessage = (ev) => {
            const data = JSON.parse(ev.data);
            console.log(data);
        }

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