// import logo from './logo.svg';
import "./App.css";
import React from "react";
import { HashRouter, Route } from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";
class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { novel_list: [], is_novel_list_get: false };
  }
  componentDidMount() {
    if (!this.state.is_novel_list_get) {
      fetch("http://localhost:8088/novels")
        .then((response) => response.json())
        .then((data) => {
          this.setState({ novel_list: data, is_novel_list_get: true });
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
            component={() => <MainPage novel_list={this.state.novel_list} />}
          ></Route>
          <Route path="/novel" exact component={NovelReadPage}></Route>
        </HashRouter>
      </div>
    );
  }
}

export default App;
