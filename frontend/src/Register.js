import React from "react";

export class Register extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            OK: false,
            username: "",
            pass1: "",
            pass2: "",
        };
    }

    isValidUsername(name) {
        return name.length >= 3 && name.length <= 20;
    }

    isValidPass(pass) {
        return pass.length >= 3;
    }

    validateInput() {
        let OK = true;

        if (!this.isValidUsername(this.state.username)) {
            OK = false;
        }

        if (!this.isValidPass(this.state.pass1)) {
            OK = false;
        }

        if (this.state.pass1 !== this.state.pass2) {
            OK = false;
        }

        this.setState({ OK });
    }

    handleChange(prop, event) {
        console.log(prop, event.target.value);
        this.setState({ [prop]: event.target.value }, () => {
            this.validateInput();
        });
    }

    render() {
        return (
            <div>
                <h1>Register</h1>
                <div>Username: <input onChange={(e) => this.handleChange("username", e)} type="text" /></div>
                <div>Password: <input onChange={(e) => this.handleChange("pass1", e)} type="password" /></div>
                <div>Repeat Password: <input onChange={(e) => this.handleChange("pass2", e)} type="password" /></div>
                <div><input disabled={!this.state.OK} type="button" value="Register" /></div>
            </div>
        );
    }
}