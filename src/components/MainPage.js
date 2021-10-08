import React from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import SideNavigation from "./SideNavigation";
import "./MainPage.css";
class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { is_show: false };
    this.visibleChange = this.visibleChange.bind(this);
  }
  render() {
    // console.log(this.props.novel_list)
    return (
      <div className="MainPage">
        <NavigationBar
          className="c"
          visibleChange={this.visibleChange}
          location="/novel"
        ></NavigationBar>
        <NovelList novel_list={this.props.novel_list}></NovelList>
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
