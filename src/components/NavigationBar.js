// import { button } from "react-bootstrap";
import React, {useRef, useState} from "react";
import "./css/NavigationBar.css";
import {Button} from "react-bootstrap";
import {Box, IconButton, Input, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {HamburgerIcon} from "@chakra-ui/icons";
import LoadingPage from "./LoadingPage";

function NavigationBar() {
    const search = () => {
        const element = document.querySelector("#NavigationBar > input");
        window.updateNovelList(element.value);
    }
    return (
        <Box className="NavigationBar" paddingTop={'1px'}>
            <SettingMenu/>
            <Input placeholder="input search text to search title" border={'1px solid'} borderColor={'black'}/>
            <Button onClick={search}>Search</Button>
        </Box>
    );
}

function SettingMenu() {
    const [loading, setLoading] = useState(false)
    const uploadRef = useRef()
    const startUpload = (event) => {
        setLoading(true)
        const formData = new FormData()
        formData.append('file', event.target.files[0])

        const options = {
            method: 'POST',
            body: formData,
        }
        console.log(formData)
        fetch(window.serverURL + "novels", options).then(response => ({
            status: response.status,
            data: response
        })).then(data => {
            if (data.status === 208) {
                alert('file exist')
            } else if (data.status !== 200) {
                alert('error')
            } else {
                data.data.json().then(() => {
                    window.updateNovelList()
                    alert('success')
                })
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
