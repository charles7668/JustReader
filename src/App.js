// import logo from './logo.svg';
import "./App.css";
import React from "react";
import { HashRouter, Route } from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
class App extends React.Component {
  render() {
    return (
      <div className="App">
        <HashRouter>
          <Route path="/" exact component={MainPage}></Route>
          <Route path="/novel" exact component={NovelReadPage}></Route>
        </HashRouter>
      </div>
    );
  }
}

export default App;
