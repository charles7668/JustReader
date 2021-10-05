import NovelItem from "./NovelItem";
import React from "react";
class NovelList extends React.Component {
  render() {
    const element = (
      <div>
        <NovelItem />
        <NovelItem />
      </div>
    );

    return element;
  }
}

export default NovelList;
