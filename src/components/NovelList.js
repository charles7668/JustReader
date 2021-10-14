import NovelItem from "./NovelItem";
import React from "react";

class NovelList extends React.Component {
    render() {
        window.updateNovelList = () => {
            this.setState({})
        }
        let element = <div className="NovelList"/>
        if (window.novel_list !== null && window.novel_list.length > 0) {
            const ListItem = window.novel_list.map((novel, index) => {
                return (
                    <div className="NovelList">
                        <NovelItem
                            key={novel}
                            novel_information={novel}
                            index={index}
                        />
                        <hr/>
                    </div>
                )
            });
            element = <div className="NovelList">{ListItem}</div>;
        }

        return element;
    }
}

export default NovelList;
