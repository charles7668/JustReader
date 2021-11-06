import "./App.css";
import React, {useEffect, useRef, useState} from "react";
import {HashRouter, Route} from "react-router-dom";
import MainPage from "./components/MainPage";
import NovelReadPage from "./components/NovelReadPage";
import "bootstrap/dist/css/bootstrap.min.css";
import Alert, {useAlert} from "./components/Alert"
import SearchPage from "./components/SearchPage";

export const SettingContext = React.createContext({})
export const AlertContext = React.createContext(function (message, title = "unset") {

})

function App() {
    const [setting, setSetting] = useState({})
    const [isAlert, alertTitle, alertMessage, showAlert, closeAlert] = useAlert()
    const showAlertRef = useRef(showAlert)
    useEffect(() => {
        fetch(window.serverURL + "setting").then(res => res.json()).then(data => {
            setSetting(data)
        }).catch(err => {
            showAlertRef.current(err, "error")
        })
    }, [])
    return (
        <div className="App">
            <AlertContext.Provider value={showAlertRef.current}>
                <SettingContext.Provider value={setting}>
                    <HashRouter>
                        <Route
                            path="/"
                            exact
                            component={MainPage}
                        />
                        <Route path="/chapters" component={NovelReadPage}/>
                        <Route path="/search" component={SearchPage}/>
                    </HashRouter>
                </SettingContext.Provider>
                <Alert isOpen={isAlert} alertTitle={alertTitle} alertMessage={alertMessage} closeAlert={closeAlert}/>
            </AlertContext.Provider>
        </div>
    );
}

export default App;
