import React from "react";
import NavigationBar from "./NavigationBar";
class NovelReadPage extends React.Component {
  render() {
    const element = (
      <div id="NovelReadPage">
        <NavigationBar style={{ width: "100%" }} location="/"></NavigationBar>
        <p>
          testtestijoiewjfoiajfojewfoijewofijiowajfoiawejfiojfoijioweajffffff
        </p>
      </div>
    );
    return element;
  }
}

export default NovelReadPage;
