// import logo from './logo.svg';
import "./App.css";
import React from "react";
import {HashRouter, Route} from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";

window.novel_list = []

class App extends React.Component {
    constructor(props) {
        super(props);
        this.state = {is_novel_list_get: false};
    }

    componentDidMount() {
        if (!this.state.is_novel_list_get) {
            fetch("http://localhost:8088/novels")
                .then((response) => response.json())
                .then((data) => {
                    window.novel_list = data
                    this.setState({is_novel_list_get: true});
                });
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
                    <Route path="/novel" exact component={NovelReadPage}></Route>
                </HashRouter>
            </div>
        );
    }
}

export default App;
