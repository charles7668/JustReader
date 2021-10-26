import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import {ChakraProvider} from "@chakra-ui/react";

window.chapters = []
window.current_index = 0
window.current_chapter_index = 0
window.updateNovelList = undefined;
window.searchTextChange = undefined;
window.serverURL = process.env.REACT_APP_SERVER_URL === undefined ? "/" : process.env.REACT_APP_SERVER_URL;
window.searchText = ""

ReactDOM.render(
    <React.StrictMode>
        <ChakraProvider>
            <App/>
        </ChakraProvider>
    </React.StrictMode>
    ,
    document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
