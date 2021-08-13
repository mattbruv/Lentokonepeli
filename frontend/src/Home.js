import React from "react";
import { ServerList } from "./ServerList";

export class Home extends React.Component {
    render() {
        return <div>
            Home page
            <ServerList />
        </div>
    }
}