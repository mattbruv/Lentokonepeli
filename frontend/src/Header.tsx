import React from "react";

import { Link } from "react-router-dom";

import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown"
import Container from "react-bootstrap/Container";
import Polyglot from "node-polyglot";
import { Languages } from "./lang";

type MyProps = {
    lang: Polyglot;
    langUpdate: (lang: string) => void
};

type MyState = {
    count: number;
};

export default class Header extends React.Component<MyProps, MyState> {
    state: MyState = {
        count: 0
    }
    render() {
        const _ = this.props.lang;
        return (
            <Navbar bg="light" expand="sm">
                <Container>
                    <Navbar.Brand as={Link} to="/">{_.t("name")}</Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <Navbar.Collapse id="basic-navbar-nav">
                        <Nav>
                            <Nav.Link as={Link} to="about">{_.t("about")}</Nav.Link>
                            <NavDropdown className="ml-auto" title={_.t("language")} id="nav-dropdown">
                                {Languages.map((lang) => {
                                    return (
                                        <NavDropdown.Item
                                            onClick={() => { this.props.langUpdate(lang.tag) }}
                                            key={lang.tag}
                                            active={_.t("lang") === lang.tag}
                                        >{lang.name}</NavDropdown.Item>
                                    );
                                })}
                            </NavDropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        );
    }
}