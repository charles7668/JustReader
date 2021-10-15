import NovelItem from "./NovelItem";
import React from "react";

class NovelList extends React.Component {
    constructor(props) {
        super(props);
        window.updateNovelList = () => {
            this.setState({})
        }
    }

    render() {
        let element = <div className="NovelList"/>
        console.log(window.searchText)
        const searchText = window.searchText === undefined ? "" : window.searchText;
        let list = [];
        if (window.novel_list !== null && window.novel_list.length > 0) {
            list = window.novel_list.filter(novel => novel.name.includes(searchText))
            console.log(list)
        }

        if (list.length > 0) {
            const ListItem = list.map((novel, index) => {
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
