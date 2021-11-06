import NovelItem, {NovelItemForSearch} from "./NovelItem";
import React, {useEffect, useMemo, useRef, useState} from "react";
import './css/NovelList.css'
import {HStack} from "@chakra-ui/react";
import CoverSelect from "./CoverSelect";

function NovelList() {
    const [searchText, setSearchText] = useState('')
    const [coverSelectStatus, setCoverSelectStatus] = useState({})
    const [listItem, setListItem] = useState(undefined)
    const listRef = useRef([])
    const updateListItemRef = useRef(() => {
        const list = listRef.current.filter(novel => novel.name.includes(searchText))
        setListItem(list.map((novel) => {
                return (
                    <NovelItem
                        key={novel.id}
                        novelInformation={novel}
                        updateInformation={updateNovelInformationRef.current}
                        deleteItem={deleteItemRef.current}
                        coverSelect={() =>
                            setCoverSelectStatus({name: novel.name, rowID: novel.id, isOpen: true})
                        }
                    />
                )
            })
        )
    })
    const updateNovelInformationRef = useRef((rowID) => {
        fetch(window.serverURL + "novels/" + rowID).then((res) => {
            return {status: res.status, data: res.json()}
        }).then((obj) => {
                if (obj.status === 200) {
                    obj.data.then((data) => {
                        // noinspection LoopStatementThatDoesntLoopJS,JSUnusedAssignment
                        for (let i = 0; i < listRef.current.length; i++) {
                            if (listRef.current[i].id === rowID) {
                                listRef.current[i] = data
                            }
                            break;
                        }
                        updateListItemRef.current()
                    })
                }
            }
        )
    })
    const deleteItemRef = useRef((rowID) => {
        for (let i = 0; i < listRef.current.length; i++) {
            if (listRef.current[i].id === rowID) {
                listRef.current.splice(i, 1)
                break;
            }
        }
        updateListItemRef.current()
    })

    useEffect(() => {
        window.searchTextChange = (text) => {
            setSearchText(text)
        }
        window.updateNovelList = (data) => {
            listRef.current.unshift(data)
            updateListItemRef.current()
        }
        fetch(window.serverURL + "novels").then((response) => response.json()).then(data => {
            listRef.current = (Array.isArray(data) ? data : [])
            updateListItemRef.current()
        })
        return () => {

        }
    }, [])

    return <HStack className="NovelList" spacing="20px" wrap="wrap" alignItems={'start'} alignContent={'flex-start'}
                   paddingLeft={'10px'} paddingRight={'10px'}>{listItem}
        <div className="LastElement"/>
        <CoverSelect name={coverSelectStatus.name} rowID={coverSelectStatus.rowID} isOpen={coverSelectStatus.isOpen}
                     onClose={() => setCoverSelectStatus({...coverSelectStatus, isOpen: false})}
                     updateCover={updateNovelInformationRef.current}
        />
    < /HStack>;
}

export function NovelListForSearch() {
    const [searchText, setSearchText] = useState('')
    const [listItem, setListItem] = useState(undefined)
    const listRef = useRef([])
    const runningStateRef = useRef(false)
    const searchNovelRef = useRef((text) => {
        const getData = () => {
            return fetch(window.serverURL + "search/get", {method: 'POST'}).then((res) => res.json()).then((data) => {
                if (data !== null) {
                    for (let i = 0; i < data.length; i++) {
                        listRef.current.push(data[i])
                    }
                    setListItem(listRef.current.map((novel, index) => {
                        return (
                            <NovelItemForSearch
                                key={index.toString() + novel.title}
                                novel={novel}
                            />
                        )
                    }))
                }
            })
        }
        const option = {
            method: 'POST',
            body: JSON.stringify({search_key: text})
        }
        fetch(window.serverURL + "search", option).then((res) => {
            return {status: res.status, data: res.json()}
        }).then((obj) => {
            if (obj.status !== 200) {
                alert(obj.data.message)
                runningStateRef.current = false
                return
            }
            obj.data.then((data) => {
                if (data.status === 3) {
                    getData().then(() => {
                        setTimeout(() => {
                            searchNovelRef.current(text)
                        }, 1000)
                    })
                } else if (data.status === 4) {
                    console.log('4')
                    getData().then(() => {
                        console.log(listRef.current)
                        runningStateRef.current = false
                    })
                }
            })
        }).catch(err => {
            alert(err)
            runningStateRef.current = false
        })
    })
    useEffect(() => {
        window.searchTextChange = (text) => {
            setSearchText(text)
        }
        return () => {

        }
    }, [])

    useMemo(() => {
        if (runningStateRef.current === false && searchText !== "") {
            console.log(searchText)
            listRef.current = []
            runningStateRef.current = true
            searchNovelRef.current(searchText)
        }
    }, [searchText])

    return <HStack className="NovelList" spacing="20px" wrap="wrap" alignItems={'start'} alignContent={'flex-start'}
                   paddingLeft={'10px'} paddingRight={'10px'}>{listItem}
        <div className="LastElement"/>
        />
    < /HStack>;
}

export default NovelList;
