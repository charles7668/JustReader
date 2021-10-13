import NovelItem from "./NovelItem";
import React from "react";

class NovelList extends React.Component {
    render() {
        const ListItem = window.novel_list.map((novel, index) => {
            return (
                <div className="NovelList">
                    <NovelItem
                        key={novel}
                        novel_information={novel}
                        index={index}
                    ></NovelItem>
                    <hr/>
                </div>
            )
        });
        const element = <div className="NovelList">{ListItem}</div>;

        return element;
    }
}

export default NovelList;
