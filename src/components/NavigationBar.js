// import { button } from "react-bootstrap";
import React from "react";
import {Redirect} from "react-router-dom";
import "./NavigationBar.css";
import {Button} from "react-bootstrap";

class NavigationBar extends React.Component {
    constructor(props) {
        super(props);
        this.state = {redirect: false};
        this.search = this.search.bind(this);
    }

    search() {
        const element = document.querySelector("#NavigationBar > input");
        window.searchText = element.value;
        window.updateNovelList();
    }

    render() {
        const navigator = (
            <div id="NavigationBar">
                <div id='slide_nav'>
                    <p id="slide_nav_button"
                       onClick={() => this.props.sidePanelVisibleChange(!this.props.sidePanelVisible)}>☰</p>
                </div>
                <input placeholder="input search text to search title"/>
                <Button onClick={this.search}>Search</Button>
            </div>
        );
        const redirect = <Redirect to={this.props.location}/>;
        return this.state.redirect ? redirect : navigator;
    }
}

export default NavigationBar;
