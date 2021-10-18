import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-client";
import ServerList from "./ServerList";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";
import { GameClient, loadResources } from "lento-client/lib/client";

type HomeProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

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
        gameClient.disconnect();
    }

    leaveServer() {
        this.closeGameSocket();
        this.setState({ gameConnection: false });
    }

    joinServer(url: string) {

        console.log("joining server " + url);
        gameClient = new GameClient();
        gameClient.connect(url, () => {
            this.setState({ gameConnection: true }, () => {
                gameClient.appendCanvas("#gameCanvas");
            });
        });

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