import React from "react";
import "./LoadingPage.css"

class LoadingPage extends React.Component {
    render() {
        return (
            <div className="LoadingPage">
                <div className="wrapper">
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                    <div className="loader">
                        <div className="dot"/>
                    </div>
                </div>
                <h1 className="LoadingText">{this.props.text}</h1>
            </div>
        );
    }
}

export default LoadingPage;

