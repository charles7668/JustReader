// noinspection JSUnresolvedVariable

import React, {useEffect, useState} from "react";
import "./css/NovelItem.css";
import {Redirect} from "react-router-dom";
import {Button} from "react-bootstrap";
import LoadingPage from "./LoadingPage";

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
            props.update()
            alert(data.message)
        })
    }
    let redirectPath = "/novel/" + novel.md5;
    const src = "data:image/png;base64," + novel.cover;
    const redirect = (
        <Redirect to={{pathname: redirectPath, state: {novel: novel}}}/>
    )
    const element = (
        <div className="NovelItem">
            <div className="NovelCover">
                <img
                    src={src}
                    alt="no cover"
                />
            </div>
            <div className="NovelInformation">
                <p onClick={() => {
                    setNovelView(true)
                }}> {novel.name} </p>
                <p>{novel.current_chapter}</p>
                <p>{novel.last_chapter}</p>
                <p>簡介:</p>
                <p className="NovelBrief"
                   dangerouslySetInnerHTML={{__html: novel.brief?.replaceAll('\n', '<br>')}}/>
            </div>
            <div className="NovelActionBar">
                <Button variant="outline-primary"
                        onClick={() => {
                            uploadCover()
                        }}>上傳圖片</Button>
                <Button variant="outline-secondary" onClick={() => {
                    deleteItem()
                }}>Delete</Button>
            </div>
            {loading === true && <LoadingPage text={"uploading"}/>}
        </div>
    );
    return novelView ? redirect : element;
}

export default NovelItem;
