// noinspection JSUnresolvedVariable

import React, {useState} from "react";
import "./css/NovelItem.css";
import {Redirect} from "react-router-dom";
import {Button} from "react-bootstrap";
import LoadingPage from "./LoadingPage";

function NovelItem(props) {
    const [novelView, setNovelView] = useState(false)
    const [loading, setLoading] = useState(false)

    let redirect_path = "/novel/" + props.novel_information.md5;

    const src = "data:image/png;base64," + props.novel_information.cover;
    const redirect = (
        <Redirect to={{pathname: redirect_path, state: {novel: props.novel_information, index: props.index}}}/>
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
                    window.current_index = props.index
                    setNovelView(true)
                }}> {props.novel_information.name} </p>
                <p>{props.novel_information.current_chapter}</p>
                <p>{props.novel_information.last_chapter}</p>
                <p>簡介:</p>
                <p className="NovelBrief"
                   dangerouslySetInnerHTML={{__html: props.novel_information.brief?.replaceAll('\n', '<br>')}}/>
            </div>
            <div className="NovelActionBar">
                <Button variant="outline-primary"
                        onClick={() => {
                            uploadCover({rowID: props.novel_information.id, index: props.index, setLoading: setLoading})
                        }}>上傳圖片</Button>
                <Button variant="outline-secondary" onClick={() => {
                    deleteItem({rowID: props.novel_information.id})
                }}>Delete</Button>
            </div>
            {loading === true && <LoadingPage text={"uploading"}/>}
        </div>
    );
    return novelView ? redirect : element;
}


const uploadCover = ({rowID, index, setLoading}) => {
    const input = document.createElement("input")
    input.type = "file"
    input.addEventListener('change', () => {
        const formData = new FormData()
        formData.append('file', input.files[0])
        const options = {
            method: 'POST',
            body: formData
        }
        setLoading(true)
        fetch(window.serverURL + "cover/" + rowID, options).then(response => response.json()).then(data => {
            if (data.status !== 0) {
                alert(data.message)
            }
            window.novel_list[index].cover = data.message
            setLoading(false)
        })
    })
    input.click()
}

const deleteItem = ({rowID}) => {
    let dialog = window.confirm('確定刪除?');
    if (!dialog) return;
    const options = {
        method: 'POST'
    }
    fetch(window.serverURL + "delete/" + rowID, options).then(response => response.json()).then(data => {
        for (let i = 0; i < window.novel_list.length; i++) {
            if (window.novel_list[i].id === rowID) {
                window.novel_list.splice(i, 1)
                break
            }
        }
        window.updateNovelList()
        alert(data.message)
    })
}
export default NovelItem;
