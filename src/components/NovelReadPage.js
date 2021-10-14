import React from "react";
import {Button} from "react-bootstrap";
import {Redirect} from "react-router";
import arrow from "../image/icons8-chevron-left-48.png";
import "./NovelReadPage.css";

class NovelReadPage extends React.Component {
    chapter_content;

    constructor(props) {
        super(props);
        this.state = {is_go_back: false, title: "", md5: "", content: "loading..."};
        this.goBack = this.goBack.bind(this);
        this.updateContent = this.updateContent.bind(this);
        this.previousPage = this.previousPage.bind(this);
        this.nextPage = this.nextPage.bind(this);
    }

    goBack() {
        window.chapters = []
        const options = {
            method: 'POST',
            body: JSON.stringify(window.novel_list[0]),
            headers: {
                'Content-Type': 'application/json'
            }
        }
        fetch("http://localhost:8088/update_reading/" + window.novel_list[0].id, options).then(response => response.text()).then(data => {
            if (data === "fail")
                alert("fail")
        })
        this.setState({is_go_back: true})
    }

    async componentDidMount() {
        console.log(window.chapters)
        if (window.chapters[0] === undefined && window.novel_list[0] !== undefined) {
            console.log(1)
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            await fetch("http://localhost:8088/update_time/" + window.novel_list[window.current_index].id, options).then(res => res.text()).then(data => {
                window.novel_list[window.current_index].last_access = data
                let item = window.novel_list.splice(window.current_index, 1)
                window.novel_list.splice(0, 0, item[0])
                window.current_index = 0
            })
            await fetch("http://localhost:8088/novels/" + window.novel_list[window.current_index].md5).then(response => response.json()).then(data => window.chapters = data)
            if (window.novel_list[window.current_index].current_chapter === "未讀") {
                window.current_chapter_index = 0;
                window.novel_list[0].current_chapter = window.chapters[0].chapter_name
            }
            for (let i = 0; i < window.chapters.length; i++) {
                if (window.chapters[i].chapter_name === window.novel_list[window.current_index].current_chapter)
                    window.current_chapter_index = i;
            }
            // let page = document.querySelector("#NovelReadPage");
            this.setState({
                title: window.chapters[window.current_chapter_index].chapter_name,
                content: window.chapters[window.current_chapter_index].chapter_content
            })
        } else {
            this.goBack()
        }
    }

    updateContent() {
        let title = window.chapters[window.current_chapter_index].chapter_name
        let content = window.chapters[window.current_chapter_index].chapter_content
        window.novel_list[window.current_index].current_chapter = title
        this.setState({
            title: title,
            content: content
        })
    }

    nextPage() {
        window.current_chapter_index = window.current_chapter_index + 1
        this.updateContent()
    }

    previousPage() {
        window.current_chapter_index = window.current_chapter_index - 1
        this.updateContent()
    }

    render() {
        const content = this.state.content.split('\n').map(function (s) {
            return <p>{s}</p>
        })
        const element = (
            <div id="NovelReadPage">
                <div className="title_bar">
                    <Button className="GoBackButton" onClick={this.goBack}>
                        <img
                            src={arrow}
                            alt="error"
                        ></img>
                    </Button>
                    <h1>{this.state.title}</h1>
                    <div className="PageChangeBar">
                        {window.current_chapter_index > 0 &&
                        <Button variant="outline-secondary" onClick={this.previousPage}>上一頁</Button>}
                        {window.current_chapter_index < window.chapters.length &&
                        <Button variant="outline-secondary" onClick={this.nextPage}>下一頁</Button>}
                    </div>
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
