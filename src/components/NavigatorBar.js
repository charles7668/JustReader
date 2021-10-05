// import { Button } from "react-bootstrap";
import React from "react";
import { Button } from "react-bootstrap";
import "./NavigatorBar.css";
class NavigatorBar extends React.Component {
  render() {
    const navigator = (
      <div id="navigator_bar">
        <Button onClick={() => this.props.visibleChange(true)}>test</Button>
        <input placeholder="input search text"></input>
        <Button>test</Button>
      </div>
    );

    return navigator;
  }
}

export default NavigatorBar;
