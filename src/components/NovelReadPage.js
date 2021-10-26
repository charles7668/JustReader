// noinspection JSUnresolvedVariable

import React, {useEffect, useRef, useState} from "react";
import {Button} from "react-bootstrap";
import {Redirect} from "react-router";
import "./css/NovelReadPage.css";
import {Box, IconButton, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {AiOutlineArrowLeft, DiAptana} from "react-icons/all";
import {SketchPicker} from "react-color";

function NovelReadPage(props) {
    const [chapterIndex, setChapterIndex] = useState(0)
    const [isGoBack, setIsGoBack] = useState(false)
    const [backgroundColorPick, setBackgroundColorPick] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState("#000")
    const [fontColor, setFontColor] = useState('#FFF')
    const [fontColorPick, setFontColorPick] = useState(false)
    const [pickColor, setPickColor] = useState('#000')
    const [viewChapter, setViewChapter] = useState({title: '', content: 'loading'})
    const novel = useRef({information: {}, chapters: []})
    const numberOfChapters = useRef(0)
    const updateColor = useRef()
    const contentRef = useRef(undefined)
    const completeRef = useRef(false)

    async function updateReading() {
        console.log('up')
        const options = {
            method: 'POST',
            body: JSON.stringify(novel.current.information),
            headers: {
                'Content-Type': 'application/json'
            }
        }
        await fetch(window.serverURL + "update_reading/" + novel.current.information.id, options).then(response => response.text()).then(data => {
            if (data === "fail")
                alert("fail")
        }).catch(err => {
            alert(err)
        })
    }

    function goBack() {
        updateReading().then(() => setIsGoBack(true))
    }

    useEffect(() => {
        if (completeRef.current) {
            setViewChapter({
                title: novel.current.chapters[chapterIndex].chapter_name,
                content: novel.current.chapters[chapterIndex].chapter_content
            })
        }
    }, [chapterIndex])

    useEffect(() => {
        if (completeRef.current) {
            novel.current.information.current_chapter = viewChapter.title
            // noinspection JSIgnoredPromiseFromCall
            updateReading()
            if (contentRef.current !== undefined) {
                contentRef.current.scrollTop = 0
            }
        }
    }, [viewChapter])

    useEffect(() => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
        if (props.location.state === undefined) return
        const tempNovel = props.location.state.novel
        const getChapter = async () => await fetch(window.serverURL + "novels/" + tempNovel.md5).then(response => response.json()).then(data => {
            if (!Array.isArray(data)) {
                alert("response type error")
                setIsGoBack(true)
                return
            }
            if (tempNovel.current_chapter === "未讀") {
                tempNovel.current_chapter = data[0].chapter_name
            }
            let index = 0;
            for (let i = 0; i < data.length; i++) {
                if (tempNovel.current_chapter === data[i].chapter_name) {
                    index = i
                    break;
                }
            }
            numberOfChapters.current = data.length
            novel.current = {information: tempNovel, chapters: data}
            setChapterIndex(index)
            setViewChapter({title: data[index].chapter_name, content: data[index].chapter_content})
            completeRef.current = true
        })
        fetch(window.serverURL + "update_time/" + tempNovel.id, options).then(res => res.text()).then(() => {
            getChapter().then(r => r)
        })
    }, [props.location.state])


    const goBackRedirect = <Redirect to="/"/>;
    //if refresh page then back to home
    if (props.location.state === undefined) {
        return goBackRedirect
    }
    const contentItem = viewChapter.content.split('\n').map(function (s) {
        return <p>{s}</p>
    })
    const element = (
        <Box className="NovelReadPage" style={{backgroundColor: backgroundColor, color: fontColor}}>
            <Box className="TitleBar">
                <IconButton className="GoBackButton" onClick={() => {
                    goBack()
                }} bg={backgroundColor} aria-label={"goBack"} icon={<AiOutlineArrowLeft/>}>
                </IconButton>
                <h1>{viewChapter.title}</h1>
                <Box className="PageChangeBar" position={"relative"}>
                    <Menu closeOnSelect={false}>
                        < MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<DiAptana/>}
                            variant="ghost"
                            height="100%"
                            _hover={{bg: "gray.400"}} _focus={{bg: "gray.400"}}
                            _expanded={{bg: "gray.400"}}
                        />
                        <MenuList backgroundColor={backgroundColor} color={fontColor}>
                            <MenuItem onClick={() => {
                                updateColor.current = (color) => {
                                    setBackgroundColor(color);
                                    setPickColor(color)
                                }
                                setFontColorPick(false)
                                setBackgroundColorPick(!backgroundColorPick)
                            }}
                                      _focus={{bg: "gray.400"}}
                                      _hover={{bg: "gray.400"}}
                            >
                                background color
                            </MenuItem>
                            <MenuItem onClick={() => {
                                updateColor.current = (color) => {
                                    setFontColor(color);
                                    setPickColor(color)
                                }
                                setBackgroundColorPick(false)
                                setFontColorPick(!fontColorPick)
                            }}
                                      _hover={{bg: "gray.400"}}
                                      _focus={{bg: "gray.400"}}>
                                font color
                            </MenuItem>
                            {(fontColorPick || backgroundColorPick) &&
                            <SketchPicker color={pickColor} onChange={color => updateColor.current(color.hex)}
                                          className={"ColorPicker"}/>}
                        </MenuList>
                    </Menu>
                    {chapterIndex > 0 &&
                    <Button variant="outline-secondary" onClick={() => {
                        setChapterIndex(chapterIndex - 1)
                    }}
                            style={{color: fontColor, backgroundColor: backgroundColor}}>上一頁</Button>}
                    {chapterIndex < numberOfChapters.current &&
                    <Button variant="outline-secondary" onClick={() => {
                        setChapterIndex(chapterIndex + 1)
                    }}
                            style={{color: fontColor, backgroundColor: backgroundColor}}>下一頁</Button>}
                </Box>
            </Box>
            <hr/>
            <Box className="NovelContent" ref={node => contentRef.current = node}>
                {contentItem}
            </Box>
        </Box>
    );

    return isGoBack ? goBackRedirect : element;
}

export default NovelReadPage;
