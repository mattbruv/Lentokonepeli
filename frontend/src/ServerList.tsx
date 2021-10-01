import Polyglot from "node-polyglot";
import React from "react";
import { ServerInfo } from "lento-gui";

type ServerListProps = {
    lang: Polyglot;
    servers: ServerInfo[];
}

type ServerListState = {
}

export default class ServerList extends React.Component<ServerListProps, ServerListState> {

    renderServerList() {
        return (
            this.props.servers.map((server) => {
                return (
                    <div key={server.url}>
                        Server: {server.url}
                    </div>
                );
            })
        )
    }

    render() {
        // const _ = this.props.lang;
        return (
            <div>
                Server List:
                {this.renderServerList()}
            </div>
        )
    }
}