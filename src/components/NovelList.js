import NovelItem from "./NovelItem";
import React, {useState} from "react";
import './css/NovelList.css'

function useForceUpdate() {
    const [value, setValue] = useState(0)
    return () => setValue(value + 1)
}

function NovelList() {
    let element = <div className="NovelList"/>
    const searchText = window.searchText === undefined ? "" : window.searchText;
    window.updateNovelList = useForceUpdate();
    let list = []
    if (window.novel_list !== null && window.novel_list.length > 0) {
        list = window.novel_list.filter(novel => novel.name.includes(searchText))
    }
    if (list.length > 0) {
        const ListItem = list.map((novel, index) => {
            return (
                <NovelItem
                    key={novel}
                    novel_information={novel}
                    index={index}
                />
            )
        });
        element = <div className="NovelList">{ListItem}<div className="LastElement"/></div>;
    }
    return element;
}

export default NovelList;
