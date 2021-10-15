import React from "react";
import "./NovelItem.css";
import {Redirect} from "react-router-dom";
import {Button} from "react-bootstrap";
import LoadingPage from "./LoadingPage";

class NovelItem extends React.Component {
    current_chapter;
    last_chapter;
    chapter_name;
    md5;
    brief;
    cover;

    constructor(props) {
        super(props);
        this.state = {
            novel_view: false,
            loading: false
        }
        this.getNovelChapter = this.getNovelChapter.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
        this.uploadCover = this.uploadCover.bind(this)
    }

    async deleteItem() {
        let dialog = window.confirm('確定刪除?');
        if (!dialog) return;
        const options = {
            method: 'POST'
        }
        await fetch(window.serverURL + "delete/" + this.props.novel_information.id, options).then(response => response.json()).then(data => {
            for (let i = 0; i < window.novel_list.length; i++) {
                if (window.novel_list[i].id === this.props.novel_information.id) {
                    window.novel_list.splice(i, 1)
                    break
                }
            }
            window.updateNovelList()
            alert(data.message)
        })
    }

    uploadCover() {
        const input = document.createElement("input")
        input.type = "file"
        input.addEventListener('change', () => {
            const formData = new FormData()
            formData.append('file', input.files[0])
            const options = {
                method: 'POST',
                body: formData
            }
            this.setState({loading: true})
            fetch(window.serverURL + "cover/" + this.props.novel_information.id, options).then(response => response.json()).then(data => {
                if (data.status !== 0) {
                    alert(data.message)
                }
                window.novel_list[this.props.index].cover = data.message
                this.setState({loading: false})
            })
        })
        input.click()
    }

    render() {
        let redirect_path = "/novel/" + this.props.novel_information.md5;

        const src = "data:image/png;base64," + this.props.novel_information.cover;
        const redirect = (
            <Redirect to={redirect_path}/>
        )
        const element = (
            <div className="novel_item">
                <div className="novel_cover">
                    <img
                        src={src}
                        alt="no cover"
                    />
                </div>
                <div className="novel_information">
                    <ul style={{"list-style-type": "none", padding: "0", margin: "0"}}>
                        <li style={{"font-weight": "bold"}}>
                            <p onClick={this.getNovelChapter}> {this.props.novel_information.name} </p>
                        </li>
                        <li><p>{this.props.novel_information.current_chapter}</p></li>
                        <li><p>{this.props.novel_information.last_chapter}</p></li>
                        <li>簡介:</li>
                        <li><p className="NovelBrief"
                               dangerouslySetInnerHTML={{__html: this.props.novel_information.brief?.replaceAll('\n', '<br>')}}/>
                        </li>
                    </ul>
                </div>
                <div className="NovelActionBar">
                    <Button variant="outline-primary" onClick={this.uploadCover}>上傳圖片</Button>
                    <Button variant="outline-secondary" onClick={this.deleteItem}>Delete</Button>
                </div>
                {this.state.loading === true && <LoadingPage text={"uploading"}/>}
            </div>
        );
        return this.state.novel_view ? redirect : element;
    }

    async getNovelChapter() {
        window.current_index = this.props.index
        this.setState({novel_view: true})
    }
}

export default NovelItem;
