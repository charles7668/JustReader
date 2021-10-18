import React from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import "./MainPage.css";

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {is_show: false, side_panel_show: false};
    }

    render() {
        return (
            <div className="MainPage">
                <NavigationBar
                    className="c"
                    location="/novel"
                />
                <div className="MainPanel">
                    <NovelList/>
                </div>
            </div>
        );
    }
}

export default MainPage;
