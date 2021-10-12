import React from "react";
import "./NovelItem.css";

class NovelItem extends React.Component {
    render() {
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
                            {this.props.novel_information.name}
                        </li>
                        <li>{this.props.novel_information.current_chapter}</li>
                        <li>{this.props.novel_information.last_chapter}</li>
                    </ul>
                </div>
                <div className="novel_information_others"></div>
            </div>
        );
        return element;
    }
}

export default NovelItem;
