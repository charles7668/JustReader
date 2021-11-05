// import { button } from "react-bootstrap";
import React, {useContext, useRef, useState} from "react";
import "./css/NavigationBar.css";
import {Button} from "react-bootstrap";
import {Box, IconButton, Input, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import LoadingPage from "./LoadingPage";
import {AlertContext} from "../App";

function NavigationBar() {
    const inputRef = useRef()
    const search = () => {
        // noinspection JSUnresolvedVariable
        window.searchTextChange(inputRef.current.value);
    }
    return (
        <Box className="NavigationBar" paddingTop={'1px'}>
            <SettingMenu/>
            <Input placeholder="input search text to search title" border={'1px solid'} borderColor={'black'}
                   ref={inputRef}/>
            <Button onClick={search}>Search</Button>
        </Box>
    );
}

function SettingMenu() {
    const [loading, setLoading] = useState(false)
    const alert = useContext(AlertContext)
    const uploadRef = useRef()
    const startUpload = (event) => {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', event.target.files[0])

        const options = {
            method: 'POST',
            body: formData,
        }
        fetch(window.serverURL + "file/novel", options).then(response => ({
            status: response.status,
            data: response.json()
        })).then(obj => {
            if (obj.status === 200) {
                obj.data.then((data) => {
                    window.updateNovelList(data)
                    alert('success')
                })
            } else {
                obj.data.then((message) => alert(message.message))
            }
            setLoading(false)
        }).catch((err) => {
            alert(err)
            setLoading(false)
        })
    }

    return (
        <Menu>
            <MenuButton as={IconButton} icon={<HamburgerIcon/>} color={'black'} height={'100%'}/>
            <MenuList>
                <MenuItem> Setting </MenuItem>
                <MenuItem onClick={(e) => {
                    e.preventDefault()
                    // noinspection JSUnresolvedFunction
                    uploadRef.current.click()
                }}>Upload</MenuItem>
            </MenuList>
            <Input type="file" accept=".txt" display={'none'} ref={uploadRef} onChange={startUpload}/>
            {loading === true && <LoadingPage text={"uploading..."}/>}
        </Menu>
    )
}

export default NavigationBar;
