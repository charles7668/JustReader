// import logo from './logo.svg';
import NavigatorBar from "./components/NavigatorBar";
import NovelList from "./components/NovelList";
import SideNavigator from "./components/SideNavigator";
import "./App.css";
import React from "react";

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { is_show: false };
    this.visibleChange = this.visibleChange.bind(this);
  }
  render() {
    return (
      <div className="App">
        <div>
          <NavigatorBar
            className="c"
            visibleChange={this.visibleChange}
          ></NavigatorBar>
          <NovelList></NovelList>
        </div>
        {this.state.is_show && (
          <SideNavigator visibleChange={this.visibleChange}></SideNavigator>
        )}
        }
      </div>
    );
  }
  visibleChange(visible) {
    this.setState({ is_show: visible });
  }
}

export default App;
