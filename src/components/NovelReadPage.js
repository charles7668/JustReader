import React from "react";
import {Button} from "react-bootstrap";
import {Redirect} from "react-router";
import {Link} from "react-router-dom";
import arrow from "../image/icons8-chevron-left-48.png";
import "./NovelReadPage.css";

class NovelReadPage extends React.Component {
    chapter_content;

    constructor(props) {
        super(props);
        this.state = {is_go_back: false, title: "", md5: "", content: ""};
        this.goBack = this.goBack.bind(this);
    }

    goBack() {
        this.setState({is_go_back: true})
    }

    async componentDidMount() {
        // let page = document.querySelector("#NovelReadPage");
        if (window.chapters.length > 0) {
            // console.log(window.chapters[window.current_index].chapter_content)
            this.setState({
                title: window.chapters[window.current_index].chapter_name,
                content: window.chapters[window.current_index].chapter_content.replaceAll("\\\\", "\\")
            })
        } else {
            this.goBack()
        }
    }

    render() {
        const content = this.state.content.split('\n').map(function (s) {
            return <p>{s}</p>
        })
        const element = (
            <div id="NovelReadPage">
                <div className="title_bar">
                    <Link to="/" className="go_back_button">
                        <Button>
                            <img
                                style={{
                                    objectFit: "fill",
                                    maxWidth: "32px",
                                    maxHeight: "32px",
                                }}
                                src={arrow}
                                alt="error"
                            ></img>
                        </Button>
                    </Link>
                    <h1>{this.state.title}</h1>
                    <div></div>
                </div>
                <hr/>
                <div className="novel_content">
                    {content}
                </div>
            </div>
        );
        const go_back_redirect = <Redirect to="/"></Redirect>;
        return this.state.is_go_back ? go_back_redirect : element;
    }
}

export default NovelReadPage;
