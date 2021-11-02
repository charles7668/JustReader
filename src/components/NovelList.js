import NovelItem from "./NovelItem";
import React, {useEffect, useRef, useState} from "react";
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

export default NovelList;
