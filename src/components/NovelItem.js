import React from "react";
import "./NovelItem.css";
class NovelItem extends React.Component {
  render() {
    const element = (
      <div className="novel_item">
        <div className="novel_cover">
          <img
            src="https://user-images.githubusercontent.com/12591890/50744458-f3b01980-11e8-11e9-940b-2cc6af0906a7.gif"
            alt="test"
          ></img>
        </div>
        <div className="novel_information">
          <p>test</p>
        </div>
      </div>
    );
    return element;
  }
}

export default NovelItem;
