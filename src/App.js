import "./App.css";
import React from "react";
import {HashRouter, Route} from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
    return (
        <div className="App">
            <HashRouter>
                <Route
                    path="/"
                    exact
                    component={() => <MainPage/>}
                />
                <Route path="/novel" component={NovelReadPage}/>
            </HashRouter>
        </div>
    );
}

export default App;
