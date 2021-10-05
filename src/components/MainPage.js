import React from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import SideNavigation from "./SideNavigation";

class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { is_show: false };
    this.visibleChange = this.visibleChange.bind(this);
  }
  render() {
    return (
      <div className="MainPage">
        <NavigationBar
          className="c"
          visibleChange={this.visibleChange}
          location="/novel"
        ></NavigationBar>
        <NovelList></NovelList>
        {this.state.is_show && (
          <SideNavigation visibleChange={this.visibleChange}></SideNavigation>
        )}
      </div>
    );
  }
  visibleChange(visible) {
    this.setState({ is_show: visible });
  }
}

export default MainPage;
