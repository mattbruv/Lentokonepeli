import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";

import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Button from "react-bootstrap/Button";

type ServerListProps = {
    lang: Polyglot;
    servers: ServerInfo[];
    joinServerCB: (url: string) => void;
}

type ServerListState = {
}

export default class ServerList extends React.Component<ServerListProps, ServerListState> {

    renderServerHeader(server: ServerInfo) {
        const _ = this.props.lang;
        return (
            <Row>
                <Col><strong>{server.region}</strong></Col>
                <Col>
                    <Button
                        onClick={() => this.props.joinServerCB(server.url)}
                        variant="primary">
                        {_.t("join")}
                    </Button>
                </Col>
            </Row>
        );
    }

    renderServerList() {
        return (
            this.props.servers.map((server) => {
                return (
                    <Container key={server.url}>
                        {this.renderServerHeader(server)}
                    </Container>
                );
            })
        )
    }

    render() {
        const _ = this.props.lang;
        return (
            <React.Fragment>
                {this.renderServerList()}
            </React.Fragment>
        )
    }
}