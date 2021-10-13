import React from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import "./MainPage.css";
import SlideOutPanel from "./SlideOutPanel";

class MainPage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {is_show: false, side_panel_show: false};
        this.sidePanelVisibleChange = this.sidePanelVisibleChange.bind(this);
    }

    render() {
        // console.log(this.props.novel_list)
        return (
            <div className="MainPage">
                <NavigationBar
                    className="c"
                    sidePanelVisibleChange={this.sidePanelVisibleChange}
                    sidePanelVisible={this.state.side_panel_show}
                    location="/novel"
                ></NavigationBar>
                <div className="MainPanel">
                    {this.state.side_panel_show && <SlideOutPanel></SlideOutPanel>}
                    <NovelList></NovelList>
                </div>
            </div>
        );
    }

    sidePanelVisibleChange(visible) {
        this.setState({side_panel_show: visible})
    }
}

export default MainPage;
