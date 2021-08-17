import React from "react";

export class Register extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            OK: false,
            errors: [],
            username: "",
            pass1: "",
            pass2: "",
        };
    }

    isValidUsername(name) {
        const re = new RegExp("^[a-zA-Z0-9-_]{3,20}$");
        return name.match(re) !== null;
    }

    isValidPass(pass) {
        return pass.length >= 3;
    }

    validateInput() {
        let OK = true;
        const errors = [];

        if (!this.isValidUsername(this.state.username)) {
            errors.push("Username must be between 3 and 20 characters and may only contain letters, numbers, underscores, and hypens");
            OK = false;
        }

        if (!this.isValidPass(this.state.pass1)) {
            errors.push("Password must be at least 3 digits");
            OK = false;
        }

        if (this.state.pass1 !== this.state.pass2) {
            errors.push("Passwords must be equal");
            OK = false;
        }

        this.setState({ OK, errors });
    }

    handleChange(prop, event) {
        // console.log(prop, event.target.value);
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
                {this.state.errors.map(e => {
                    return <div className="error" key={e}>{e}</div>
                })}
            </div>
        );
    }
}