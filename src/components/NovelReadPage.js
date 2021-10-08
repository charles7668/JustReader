import React from "react";
import {Button} from "react-bootstrap";
import { Redirect } from "react-router";
import { Link } from "react-router-dom";
import arrow from "../image/icons8-chevron-left-48.png";
import "./NovelReadPage.css";
class NovelReadPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { is_go_back: false };
    this.goBack = this.goBack.bind(this);
  }
  goBack() {
    this.setState({ is_go_back: true });
  }
  render() {
    const element = (
      <div id="NovelReadPage">
        <div className="title_bar">
          <Link to="/" className="go_back_button">
            <Button>
              <img
                style={{
                  objectFit: "fill",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
                src={arrow}
                alt="error"
              ></img>
            </Button>
          </Link>
          <h1>title</h1>
          <div></div>
        </div>
        <hr/>
        <p>test</p>
      </div>
    );
    const go_back_redirect = <Redirect to="/"></Redirect>;
    return this.state.is_go_back ? go_back_redirect : element;
  }
}

export default NovelReadPage;
