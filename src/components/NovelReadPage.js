// noinspection JSUnresolvedVariable
// noinspection JSUnresolvedVariable

import React, {useContext, useEffect, useRef, useState} from "react";
import {Button} from "react-bootstrap";
import {Redirect} from "react-router";
import "./css/NovelReadPage.css";
import {Box, IconButton, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {AiOutlineArrowLeft, DiAptana} from "react-icons/all";
import {SketchPicker} from "react-color";
import {SettingContext} from "../App";

function NovelReadPage(props) {
    const settingContext = useContext(SettingContext)
    const [chapterIndex, setChapterIndex] = useState(0)
    const [isGoBack, setIsGoBack] = useState(false)
    const [backgroundColorPick, setBackgroundColorPick] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState(settingContext.reading_background_color)
    const [fontColor, setFontColor] = useState(settingContext.reading_font_color)
    const [fontColorPick, setFontColorPick] = useState(false)
    const [pickColor, setPickColor] = useState('#000')
    const [viewChapter, setViewChapter] = useState({title: '', content: 'loading'})
    const novel = useRef({information: {}, chapters: []})
    const numberOfChapters = useRef(0)
    const updateColor = useRef()
    const contentRef = useRef(undefined)
    const completeRef = useRef(false)
    // const recordRef = useRef({
    //     backgroundColor: settingContext.reading_background_color,
    //     fontColor: settingContext.reading_font_color
    // })

    async function updateReading() {
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
        updateReading().then(() => {
            settingContext.reading_background_color = backgroundColor
            settingContext.reading_font_color = fontColor
            const options = {
                method: 'POST',
                body: JSON.stringify(settingContext),
                headers: {
                    'Content-Type': 'application/json'
                }
            }
            fetch(window.serverURL + "update_setting", options).then(res => res.json()).then(message => {
                if (message.status !== 0) {
                    alert(message.message)
                }
            }).catch(err => alert(err))
            setIsGoBack(true)
        })
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
                }} bg={backgroundColor} _hover={{bg: {backgroundColor}}} aria-label={"goBack"}
                            icon={<AiOutlineArrowLeft/>}>
                </IconButton>
                <h1>{viewChapter.title}</h1>
                <Box className="PageChangeBar" position={"relative"}>
                    <Menu closeOnSelect={false} onClose={() => {
                        setBackgroundColorPick(false);
                        setFontColorPick(false);
                    }}>
                        < MenuButton
                            as={IconButton}
                            aria-label="Options"
                            icon={<DiAptana/>}
                            variant="ghost"
                            height="100%"
                            _hover={{bg: {backgroundColor}}} _focus={{bg: {backgroundColor}}}
                            _expanded={{bg: {backgroundColor}}}
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
                                      _focus={{bg: {backgroundColor}}}
                                      _hover={{bg: {backgroundColor}}}
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
                                      _hover={{bg: {backgroundColor}}}
                                      _focus={{bg: {backgroundColor}}}>
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
