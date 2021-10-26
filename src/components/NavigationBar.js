// import { button } from "react-bootstrap";
import React, {useState} from "react";
import "./css/NavigationBar.css";
import {Button} from "react-bootstrap";
import SlideOutPanel from "./SlideOutPanel";

function NavigationBar() {
    const [sideVisible, setSideVisible] = useState(false)
    const search = () => {
        const element = document.querySelector("#NavigationBar > input");
        window.updateNovelList(element.value);
    }
    return (
        <div className="NavigationBar">
            <div className="SlideNavSwitch">
                <p onClick={() => setSideVisible(!sideVisible)}>☰</p>
            </div>
            {sideVisible && <SlideOutPanel/>}
            <input placeholder="input search text to search title"/>
            <Button onClick={search}>Search</Button>
        </div>
    );
}

export default NavigationBar;
