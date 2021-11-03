import React from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import "./MainPage.css";

function MainPage() {
    return (
        <div className="MainPage">
            <NavigationBar
                location="/novel"
            />
            <div className="MainPanel">
                <NovelList/>
            </div>
        </div>
    )
}

export default MainPage;
