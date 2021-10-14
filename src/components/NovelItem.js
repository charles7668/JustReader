import React from "react";
import "./NovelItem.css";
import {Redirect} from "react-router-dom";
import {Button} from "react-bootstrap";

class NovelItem extends React.Component {
    current_chapter;
    last_chapter;
    chapter_name;
    md5;
    brief;

    constructor(props) {
        super(props);
        this.state = {novel_view: false}
        this.getNovelChapter = this.getNovelChapter.bind(this)
        this.deleteItem = this.deleteItem.bind(this)
    }

    async deleteItem() {
        let dialog = window.confirm('確定刪除?');
        if (!dialog) return;
        const options = {
            method: 'POST'
        }
        await fetch("http://localhost:8088/delete/" + this.props.novel_information.id, options).then(response => response.json()).then(data => {
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

    render() {
        let redirect_path = "/novel/" + this.props.novel_information.md5;

        const redirect = (
            <Redirect to={redirect_path}/>
        )
        const element = (
            <div className="novel_item">
                <div className="novel_cover">
                    <img
                        src="https://user-images.githubusercontent.com/12591890/50744458-f3b01980-11e8-11e9-940b-2cc6af0906a7.gif"
                        alt="error"
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
                        <li><p className="novel_brief"
                               dangerouslySetInnerHTML={{__html: this.props.novel_information.brief?.replaceAll('\n', '<br>')}}/>
                        </li>
                    </ul>
                </div>
                <div className="NovelActionBar">
                    <Button variant="outline-primary" onClick={this.deleteItem}>Delete</Button>
                </div>
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
