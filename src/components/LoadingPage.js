import React from "react";
import "./LoadingPage.css"

function LoadingPage(props) {
    const style = {}
    if (props.height !== undefined) {
        style.height = `${props.height}`
    }
    if (props.backgroundColor !== undefined){
        style.backgroundColor = `${props.backgroundColor}`
    }
    return (
        <div className="LoadingPage" style={style}>
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
            <h1 className="LoadingText">{props.text}</h1>
        </div>
    );
}

export default LoadingPage;

