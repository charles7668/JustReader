import NovelItem from "./NovelItem";
import React, {useState} from "react";
import './css/NovelList.css'
import {HStack} from "@chakra-ui/react";

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
        element = <HStack className="NovelList" spacing="20px" wrap="wrap">{ListItem}
            <div className="LastElement"/>
        </HStack>;
    }
    return element;
}

export default NovelList;
