import "./App.css";
import React, {useEffect, useState} from "react";
import {HashRouter, Route} from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";

export const SettingContext = React.createContext({})

function App() {
    const [setting, setSetting] = useState({})
    useEffect(() => {
        fetch(window.serverURL + "setting").then(res => res.json()).then(data => {
            setSetting(data)
        }).catch(err => {
            alert(err)
        })
    }, [])
    return (
        <div className="App">
            <SettingContext.Provider value={setting}>
                <HashRouter>
                    <Route
                        path="/"
                        exact
                        component={MainPage}
                    />
                    <Route path="/chapters" component={NovelReadPage}/>
                </HashRouter>
            </SettingContext.Provider>
        </div>
    );
}

export default App;
