import React, {useEffect} from "react";
import NavigationBar from "./NavigationBar";
import NovelList from "./NovelList";
import "./MainPage.css";

function MainPage() {
    useEffect(() => {
        document.title = "Novels"
        return () => {
        }
    }, [])
    return (
        <div className="MainPage">
            <NavigationBar currentUrl={"/"}/>
            <div className="MainPanel">
                <NovelList/>
            </div>
        </div>
    )
}

export default MainPage;
