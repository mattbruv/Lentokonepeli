import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";
import ServerList from "./ServerList";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

type HomeProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

export default class Home extends React.Component<HomeProps, {}> {
    render() {
        return (
            <Container fluid="md">
                <Row className="justify-content-md-center">
                    <Col sm={8}>
                        <ServerList servers={this.props.servers} lang={this.props.lang} />
                    </Col>
                </Row>
            </Container>
        )
    }
}