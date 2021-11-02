// noinspection JSUnresolvedVariable

import React, {useEffect, useState} from "react";
import "./css/NovelItem.css";
import {Redirect} from "react-router-dom";
import LoadingPage from "./LoadingPage";
import {Box, Menu, MenuButton, IconButton, MenuItem, MenuList} from "@chakra-ui/react";
import {SettingsIcon} from "@chakra-ui/icons";

function NovelItem(props) {
    const [novelView, setNovelView] = useState(false)
    const [loading, setLoading] = useState(false)
    const [novel, setNovel] = useState({})

    useEffect(() => {
        setNovel(props.novelInformation)
    }, [props.novelInformation])
    const uploadCover = () => {
        const input = document.createElement("input")
        input.type = "file"
        input.addEventListener('change', async () => {
            const formData = new FormData()
            formData.append('file', input.files[0])
            const options = {
                method: 'POST',
                body: formData
            }
            setLoading(true)
            await fetch(window.serverURL + "cover/" + novel.id, options).then(response => response.json()).then(data => {
                if (data.status !== 0) {
                    alert(data.message)
                }
                const temp = novel;
                temp.cover = data.message
                setNovel(temp)
                setLoading(false)
            })
        })
        input.click()
    }

    const deleteItem = () => {
        let dialog = window.confirm('確定刪除?');
        if (!dialog) return;
        const options = {
            method: 'POST'
        }
        fetch(window.serverURL + "delete/" + novel.id, options).then(response => response.json()).then(data => {
            props.deleteItem(novel.id)
            alert(data.message)
        })
    }
    let redirectPath = "/chapters/" + novel.md5;
    const src = "data:image/png;base64," + novel.cover;
    const redirect = (
        <Redirect to={{pathname: redirectPath, state: {novel: novel, updateInformation: props.updateInformation}}}/>
    )
    const element = (
        <Box className="NovelItem">
            <Box className="NovelCover" position={"relative"}>
                <img
                    src={src}
                    alt="no cover"
                />
                <Menu>
                    <MenuButton as={IconButton} icon={<SettingsIcon/>} position={"absolute"} right={'0'} bottom={'0'}
                                backgroundColor={"transparent"} color={"white"}/>
                    <MenuList>
                        <MenuItem onClick={uploadCover}>上傳圖片</MenuItem>
                        <MenuItem onClick={deleteItem}>Delete</MenuItem>
                        <MenuItem onClick={props.coverSelect}>搜尋圖片</MenuItem>
                    </MenuList>
                </Menu>
            </Box>
            <div className="NovelInformation">
                <p onClick={() => {
                    setNovelView(true)
                }}> {novel.name} </p>
                <p>{novel.current_chapter}</p>
                <p>{novel.last_chapter}</p>
                <p>簡介:</p>
                <p className="NovelBrief"
                   dangerouslySetInnerHTML={{__html: novel.brief?.replaceAll('\n', '<br/>')}}/>
            </div>
            {loading === true && <LoadingPage text={"uploading"}/>}
        </Box>
    );
    return novelView ? redirect : element;
}

export default NovelItem;
