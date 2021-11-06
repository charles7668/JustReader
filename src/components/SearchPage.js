import React from "react";
import NavigationBar from "./NavigationBar";
import {NovelListForSearch} from "./NovelList";
import "./css/SearchPage.css";

function SearchPage() {
    return (
        <div className="SearchPage">
            <NavigationBar currentUrl={"/search"}/>
            <div className="MainPanel">
                <NovelListForSearch/>
            </div>
        </div>
    )
}

export default SearchPage;
