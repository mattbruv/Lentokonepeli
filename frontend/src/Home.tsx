import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";
import ServerList from "./ServerList";

type HomeProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

export default class Home extends React.Component<HomeProps, {}> {
    render() {
        return (
            <div>
                <ServerList servers={this.props.servers} lang={this.props.lang} />
            </div>
        )
    }
}