import NovelItem from "./NovelItem";
import React, {useEffect, useMemo, useState} from "react";
import './css/NovelList.css'
import {HStack} from "@chakra-ui/react";

function useForceUpdate() {
    const [counter, setCounter] = useState(0)
    return [counter, () => setCounter(counter + 1)]
}

function NovelList() {
    const [searchText, setSearchText] = useState('')
    const [update, forceUpdate] = useForceUpdate()
    const [novelList, setNovelList] = useState([])

    const listItem = useMemo(() => {
        const list = novelList.filter(novel => novel.name.includes(searchText))
        return list.map((novel) => {
            return (
                <NovelItem
                    key={novel.id}
                    novelInformation={novel}
                    update={forceUpdate}
                />
            )
        })
    }, [forceUpdate, novelList, searchText])

    useEffect(() => {
        window.searchTextChange = (text) => {
            setSearchText(text)
        }
        window.updateNovelList = () => forceUpdate()
    }, [forceUpdate])

    useEffect(() => {
        fetch(window.serverURL + "novels")
            .then((response) => response.json()).then(data => setNovelList(Array.isArray(data) ? data : []))
    }, [update])

    return <HStack className="NovelList" spacing="20px" wrap="wrap" alignItems={'start'} alignContent={'flex-start'}
                   paddingLeft={'10px'} paddingRight={'10px'}>{listItem}
        <div className="LastElement"/>
    </HStack>;
}

export default NovelList;
