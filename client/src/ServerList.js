import React from "react";
import "./sass/servers.scss";

export class ServerList extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            servers: []
        };
    }

    componentDidMount() {
        fetch("/servers")
            .then((res) => res.json())
            .then((data) => {
                this.setState({ servers: data });
            });
    }

    joinServer(server) {
        this.props.joinCallback(server);
    }

    render() {
        return (
            <div className="servers">
                {this.state.servers.map((server) => {
                    return (
                        <div key={server.ip + server.port}>
                            {server.ip}:{server.port}
                            <input
                                onClick={() => this.joinServer(server)}
                                type="button"
                                value="Join" />
                        </div>
                    );
                })}
            </div>
        );
    }
}