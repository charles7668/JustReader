import NovelItem from "./NovelItem";
import React from "react";

class NovelList extends React.Component {
    render() {
        const ListItem = window.novel_list.map((novel) => {
            return (
                <div>
                    <NovelItem
                        key={novel}
                        novel_information={novel}
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
