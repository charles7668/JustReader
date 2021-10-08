import NovelItem from "./NovelItem";
import React from "react";
class NovelList extends React.Component {
  render() {
    const ListItem = this.props.novel_list.map((novel) => {
      return (
        <NovelItem
          key={novel}
          novel_information={novel.novel_information}
        ></NovelItem>
      );
    });
    const element = <div className="NovelList">{ListItem}</div>;

    return element;
  }
}

export default NovelList;
