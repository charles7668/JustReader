import React, {useEffect, useMemo, useState} from "react";
import {Button} from "react-bootstrap";
import {Redirect} from "react-router";
import "./css/NovelReadPage.css";
import {Box, IconButton, Menu, MenuButton, MenuItem, MenuList} from "@chakra-ui/react";
import {AiOutlineArrowLeft, DiAptana} from "react-icons/all";
import {SketchPicker} from "react-color";

let changePage = () => {
};

let updateColor = () => {
}

function NovelReadPage(props) {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [isGoBack, setIsGoBack] = useState(false)
    const [backgroundColorPick, setBackgroundColorPick] = useState(false)
    const [backgroundColor, setBackgroundColor] = useState("#000")
    const [fontColor, setFontColor] = useState('#FFF')
    const [fontColorPick, setFontColorPick] = useState(false)
    const [pickColor, setPickColor] = useState('#000')

    const novel = useMemo(() => {
        return {
            updateTitle: setTitle,
            updateContent: setContent,
            updateGoBack: setIsGoBack
        }
    }, [setTitle, setContent, setIsGoBack])

    novel.information = props.location.state === undefined ? undefined : props.location.state.novel
    novel.index = props.location.state === undefined ? undefined : props.location.state.index
    setUpdateContentAction({updateTitle: setTitle, updateContent: setContent})
    useEffect(() => {
        if (novel.information !== undefined) {
            checkNovelChapter({novel: novel})
        } else {
            setIsGoBack(true)
        }
    }, [novel])
    useEffect(() => {
        const contentItem = document.querySelector(".NovelContent")
        contentItem.scrollTop = 0
    }, [content])
    const contentItem = content.split('\n').map(function (s) {
        return <p>{s}</p>
    })
    const element = (
        <Box className="NovelReadPage" style={{backgroundColor: backgroundColor, color: fontColor}}>
            <Box className="TitleBar">
                <IconButton className="GoBackButton" onClick={() => {
                    goBack({setGoBack: setIsGoBack})
                }} bg={backgroundColor} aria-label={"goBack"} icon={<AiOutlineArrowLeft/>}>
                </IconButton>
                <h1>{title}</h1>
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
                                updateColor = (color) => {
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
                                updateColor = (color) => {
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
                            <SketchPicker color={pickColor} onChange={color => updateColor(color.hex)}
                                          className={"ColorPicker"}/>}
                        </MenuList>
                    </Menu>
                    {window.current_chapter_index > 0 &&
                    <Button variant="outline-secondary" onClick={previousPage}
                            style={{color: fontColor, backgroundColor: backgroundColor}}>上一頁</Button>}
                    {window.current_chapter_index < window.chapters.length &&
                    <Button variant="outline-secondary" onClick={nextPage}
                            style={{color: fontColor, backgroundColor: backgroundColor}}>下一頁</Button>}
                </Box>
            </Box>
            <hr/>
            <Box className="NovelContent">
                {contentItem}
            </Box>
        </Box>
    );
    const go_back_redirect =
        <Redirect to="/"/>
    ;
    return isGoBack ? go_back_redirect : element;
}

const goBack = (
    {
        setGoBack
    }
) => {
    window.chapters = []
    const options = {
        method: 'POST',
        body: JSON.stringify(window.novel_list[0]),
        headers: {
            'Content-Type': 'application/json'
        }
    }
    fetch(window.serverURL + "update_reading/" + window.novel_list[0].id, options).then(response => response.text()).then(data => {
        if (data === "fail")
            alert("fail")
        setGoBack(true)
    })
}

const checkNovelChapter = (
    {
        novel
    }
) => {
    if (window.chapters[0] === undefined && novel.information !== undefined) {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
        const getChapter = () => fetch(window.serverURL + "novels/" + novel.information.md5).then(response => response.json()).then(data => {
            window.chapters = data
            if (window.novel_list[novel.index].current_chapter === "未讀") {
                window.novel_list[0].current_chapter = window.chapters[0].chapter_name
            }
            for (let i = 0; i < window.chapters.length; i++) {
                if (window.chapters[i].chapter_name === window.novel_list[novel.index].current_chapter)
                    window.current_chapter_index = i;
            }
            novel.updateTitle(window.chapters[window.current_chapter_index].chapter_name)
            novel.updateContent(window.chapters[window.current_chapter_index].chapter_content)
        })
        fetch(window.serverURL + "update_time/" + window.novel_list[window.current_index].id, options).then(res => res.text()).then(data => {
            window.novel_list[novel.index].last_access = data
            let item = window.novel_list.splice(novel.index, 1)
            window.novel_list.splice(0, 0, item[0])
            getChapter().then(r => r)
        })
    } else {
        goBack({setGoBack: novel.updateGoBack})
    }
}

const setUpdateContentAction = (
    {
        updateTitle, updateContent
    }
) => {
    changePage = () => {
        let title = window.chapters[window.current_chapter_index].chapter_name
        let content = window.chapters[window.current_chapter_index].chapter_content
        window.novel_list[0].current_chapter = title
        updateTitle(title)
        updateContent(content)
    }
}


const nextPage = () => {
    window.current_chapter_index = window.current_chapter_index + 1
    changePage()
}

const previousPage = () => {
    window.current_chapter_index = window.current_chapter_index - 1
    changePage()
}

export default NovelReadPage;
