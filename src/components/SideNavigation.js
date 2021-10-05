import React from "react";

class SideNavigator extends React.Component {
  render() {
    const element = (
      <div className="SideNavigation">
        <div>
          <button onClick={() => this.props.visibleChange(false)}>Test</button>
        </div>
        <ul class="main-list">
          <li>
            <a href="/">Home</a>
          </li>
          <li>
            <a href="/">Test1</a>
          </li>
          <li>
            <a href="/">Test2</a>
          </li>
          <li>
            <a href="/">Test3</a>
          </li>
        </ul>
      </div>
    );
    return element;
  }
}

export default SideNavigator;
