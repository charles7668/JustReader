// import logo from './logo.svg';
import "./App.css";
import React from "react";
import {HashRouter, Route} from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {is_novel_list_get: false};
    }

    async componentDidMount() {
        if (!this.state.is_novel_list_get) {
            await fetch("http://localhost:8088/novels")
                .then((response) => response.json())
                .then((data) => {
                    window.novel_list = data
                    this.setState({is_novel_list_get: true})
                });
            let split = window.location.href.toString().split('/')
            if (split[split.length - 2] === "novels") {
                await fetch("http://localhost:8088/novels/" + window.novel_list[0].md5).then(response => response.json()).then(data => window.chapters = data)
                for (let i = 0; i < window.chapters.length; i++) {
                    if (window.chapters[i].chapter_name === window.novel_list[0].current_chapter)
                        window.current_index = i;
                }
            }
        }
    }

    render() {
        return (
            <div className="App">
                <HashRouter>
                    <Route
                        path="/"
                        exact
                        component={() => <MainPage/>}
                    ></Route>
                    <Route path="/novel" component={NovelReadPage}></Route>
                </HashRouter>
            </div>
        );
    }
}

export default App;
