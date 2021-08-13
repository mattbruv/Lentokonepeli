import React from "react";

export class Login extends React.Component {

    render() {
        return (
            <div>
                <h1>Login</h1>
                <div>Username: <input type="text" /></div>
                <div>Password: <input type="password" /></div>
                <div><input type="button" value="Login" /></div>
            </div>
        );
    }
}