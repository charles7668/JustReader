import NovelItem from "./NovelItem";
import React, {useEffect, useState} from "react";
import './css/NovelList.css'
import {HStack} from "@chakra-ui/react";

function useForceUpdate() {
    const [counter, setCounter] = useState(0)
    return [counter, () => setCounter(counter + 1)]
}

function NovelList() {
    const [novelList, setNovelList] = useState([])
    const [searchText, setSearchText] = useState('')
    const [update, forceUpdate] = useForceUpdate()
    let list

    useEffect(() => {
        window.searchTextChange = (text) => {
            setSearchText(text)
        }
        window.updateNovelList = () => forceUpdate()
    }, [forceUpdate])
    useEffect(() => {
        async function getList() {
            return await fetch(window.serverURL + "novels")
                .then((response) => response.json())
        }

        getList().then(data => setNovelList(Array.isArray(data) ? data : []))
    }, [update])
    list = novelList.filter(novel => novel.name.includes(searchText))
    const ListItem = list.map((novel) => {
        return (
            <NovelItem
                key={novel}
                novelInformation={novel}
                update={forceUpdate}
            />
        )
    });
    return <HStack className="NovelList" spacing="20px" wrap="wrap">{ListItem}
        <div className="LastElement"/>
    </HStack>;
}

export default NovelList;
