import React from "react";
import "./NovelItem.css";
import {Redirect} from "react-router-dom";

class NovelItem extends React.Component {
    current_chapter;
    last_chapter;
    chapter_name;
    md5;

    constructor(props) {
        super(props);
        this.state = {novel_view: false}
        this.getNovelChapter = this.getNovelChapter.bind(this)
    }

    render() {
        let redirect_path = "/novel/" + this.props.novel_information.md5;
        const redirect = (
            <Redirect to={redirect_path}></Redirect>
        )
        const element = (
            <div className="novel_item">
                <div className="novel_cover">
                    <img
                        src="https://user-images.githubusercontent.com/12591890/50744458-f3b01980-11e8-11e9-940b-2cc6af0906a7.gif"
                        alt="error"
                    ></img>
                </div>
                <div className="novel_information">
                    <ul style={{"list-style-type": "none", padding: "0", margin: "0"}}>
                        <li style={{"font-weight": "bold"}}>
                            <p onClick={this.getNovelChapter}> {this.props.novel_information.name} </p>
                        </li>
                        <li><p>{this.props.novel_information.current_chapter}</p></li>
                        <li><p>{this.props.novel_information.last_chapter}</p></li>
                    </ul>
                </div>
                <div className="novel_information_others"></div>
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
