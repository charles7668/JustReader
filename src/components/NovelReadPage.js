// noinspection JSUnresolvedVariable

import React, {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Redirect} from "react-router";
import "./css/NovelReadPage.css";
import {
    Box,
    Center,
    IconButton,
    Menu,
    MenuButton,
    MenuItem,
    MenuList,
    Slider,
    SliderFilledTrack, SliderThumb,
    SliderTrack, Stack, Switch
} from "@chakra-ui/react";
import {AiOutlineArrowLeft, BsFillFileTextFill, DiAptana} from "react-icons/all";
import {SketchPicker} from "react-color";
import {AlertContext, SettingContext} from "../App";
import {ArrowLeftIcon, ArrowRightIcon} from '@chakra-ui/icons'
import {FixedSizeList} from 'react-window';

const OpenCC = require('opencc-js');
const ChapterIndexContext = React.createContext(0)

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
    const [contentItem, setContentItem] = useState(undefined)
    const [, , , fontSize, setFontSize] = useFontSizeSelect(Number(settingContext.reading_font_size))
    const [zhView, setZhView] = useState(Boolean(settingContext.reading_tw))
    const novel = useRef({information: {}, chapters: [], titleList: []})
    const numberOfChapters = useRef(0)
    const updateColor = useRef()
    const contentRef = useRef(undefined)
    const completeRef = useRef(false)
    const alert = useContext(AlertContext)
    const functionRef = useRef({
        updateViewChapter: (chapter, id) => {
            if (chapter.chapter_url.length !== 0) {
                setViewChapter({
                    title: chapter.chapter_name,
                    content: "loading"
                })
                const option = {
                    method: "POST",
                    body: JSON.stringify(chapter)
                }
                fetch(window.serverURL + "chapters/" + id, option).then((res) => {
                    return {status: res.status, data: res.json()}
                }).then((obj) => {
                    if (obj.status !== 200) {
                        setViewChapter({
                            title: chapter.chapter_name,
                            content: "載入失敗 , " + obj.data.message
                        })
                        return
                    }
                    obj.data.then(async (data) => {
                        setViewChapter({
                            title: data.chapter_name,
                            content: data.chapter_content
                        })
                    })
                })
            } else {
                setViewChapter({
                    title: chapter.chapter_name,
                    content: chapter.chapter_content
                })
            }
        }
    })
    const updateReadingRef = useRef(async () => {
        const options = {
            method: 'POST',
            body: JSON.stringify(novel.current.information),
            headers: {
                'Content-Type': 'application/json'
            }
        }
        await fetch(window.serverURL + "update_reading/" + novel.current.information.id, options).then(response => response.text()).then(data => {
            if (data === "fail") {
                alert("fail")
            }
        }).catch(err => {
            alert(err)
        })
    })

    function goBack() {
        updateReadingRef.current().then(() => {
            settingContext.reading_background_color = backgroundColor
            settingContext.reading_font_color = fontColor
            settingContext.reading_font_size = fontSize.toString()
            settingContext.reading_tw = zhView.toString()
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
            functionRef.current.updateViewChapter(novel.current.chapters[chapterIndex], novel.current.information.id)
        }
    }, [chapterIndex])

    useEffect(() => {
        if (completeRef.current) {
            novel.current.information.current_chapter = viewChapter.title
            // noinspection JSIgnoredPromiseFromCall
            updateReadingRef.current()
            const converter = OpenCC.Converter({from: 'cn', to: 'tw'});
            setContentItem(viewChapter.content.split('\n').map(function (s, index) {
                s = s.replace(/^[\t　 \n]*/, '')
                s = "　　" + s
                if (zhView) {
                    s = converter(s)
                }
                return <p key={index}>{s}</p>
            }))
            if (contentRef.current !== undefined) {
                contentRef.current.scrollTop = 0
            }
        } else {
            setContentItem(viewChapter.content.split('\n').map(function (s, index) {
                return <p key={index}>{s}</p>
            }))
        }
    }, [viewChapter, zhView])

    useEffect(() => {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        }
        if (props.location.state === undefined) return
        const tempNovel = props.location.state.novel
        const getChapter = async () => await fetch(window.serverURL + "chapters/" + tempNovel.md5).then(response => response.json()).then(data => {
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
            novel.current = {information: tempNovel, chapters: data, titleList: data.map(item => item.chapter_name)}
            setChapterIndex(index)
            functionRef.current.updateViewChapter(data[index], novel.current.information.id)
            document.title = tempNovel.name
            // setViewChapter({title: data[index].chapter_name, content: data[index].chapter_content})
            completeRef.current = true
        })
        fetch(window.serverURL + "update_time/" + tempNovel.id, options).then(res => res.text()).then(() => {
            getChapter().then(r => r)
        })
    }, [alert, props.location.state])

    const goBackRedirect = <Redirect to="/"/>;
    //if refresh page then back to home
    if (props.location.state === undefined) {
        return goBackRedirect
    }
    const element = (
        <Box className="NovelReadPage" style={{backgroundColor: backgroundColor, color: fontColor}}>
            <Box className="TitleBar">
                <IconButton className="GoBackButton" onClick={() => {
                    goBack()
                }} bg={backgroundColor} _hover={{bg: {backgroundColor}}} aria-label={"goBack"}
                            icon={<AiOutlineArrowLeft/>}>
                </IconButton>
                <Center flex={'1'} margin={'0'} padding={'0'} overflow={"hidden"}><h1
                    className={"TitleName"}>{viewChapter.title}</h1>
                </Center>
                <Box className="PageChangeBar" position={"relative"} fontSize={"24px"}>
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
                            backgroundColor={backgroundColor} color={fontColor}
                        />
                        <MenuList backgroundColor={backgroundColor} color={fontColor}>
                            <MenuItem onClick={() => {
                                updateColor.current = (color) => {
                                    setBackgroundColor(color);
                                    setPickColor(color)
                                }
                                setFontColorPick(false)
                                setBackgroundColorPick(!backgroundColorPick)
                            }}>
                                background color
                            </MenuItem>
                            <MenuItem onClick={() => {
                                updateColor.current = (color) => {
                                    setFontColor(color)
                                    setPickColor(color)
                                }
                                setBackgroundColorPick(false)
                                setFontColorPick(!fontColorPick)
                            }}>
                                font color
                            </MenuItem>
                            <MenuItem width={"100%"}>
                                <Stack width={"100%"}>
                                    <p>Font Size ({fontSize})</p>
                                    <Slider defaultValue={fontSize} min={12} max={60}
                                            step={1}
                                            width={"100%"}
                                            onChangeEnd={(val) => setFontSize(val)}>
                                        <SliderTrack bg="red.100">
                                            <Box position="relative" right={10}/>
                                            <SliderFilledTrack bg="tomato"/>
                                        </SliderTrack>
                                        <SliderThumb boxSize={6}/>
                                    </Slider>
                                </Stack>
                            </MenuItem>
                            <MenuItem>
                                <Stack direction={"row"}>
                                    <p>繁體顯示</p>
                                    <Switch isChecked={zhView} onChange={() => {
                                        setZhView(!zhView)
                                    }}/>
                                </Stack>
                            </MenuItem>
                            {(fontColorPick || backgroundColorPick) &&
                            <SketchPicker color={pickColor} onChange={color => updateColor.current(color.hex)}
                                          className={"ColorPicker"}/>}

                        </MenuList>
                    </Menu>
                    <ChapterIndexContext.Provider value={chapterIndex}>
                        <IndexMenu chapters={novel.current.titleList} changeIndex={(i) => {
                            setChapterIndex(i)
                        }}
                                   bg={backgroundColor} font={fontColor}
                        />
                    </ChapterIndexContext.Provider>
                    {chapterIndex > 0 &&
                    <IconButton onClick={() => {
                        setChapterIndex(chapterIndex - 1)
                    }}
                                bg={backgroundColor} _hover={{bg: {backgroundColor}}}
                                _focus={{bg: {backgroundColor}}}
                                icon={<ArrowLeftIcon/>}
                                aria-label={"previousPage"}/>}
                    {chapterIndex < numberOfChapters.current &&
                    <IconButton onClick={() => {
                        setChapterIndex(chapterIndex + 1)
                    }}
                                bg={backgroundColor} _hover={{bg: {backgroundColor}}}
                                _focus={{bg: {backgroundColor}}}
                                icon={<ArrowRightIcon/>}
                                aria-label={"nextPage"}/>}
                </Box>
            </Box>
            <hr/>
            <Box className="NovelContent" ref={node => contentRef.current = node} paddingLeft={'5px'}
                 paddingRight={'5px'} fontSize={`${fontSize}px`}>
                {contentItem}
            </Box>
        </Box>
    );

    return isGoBack ? goBackRedirect : element;
}

function IndexMenu(props) {
    const index = useContext(ChapterIndexContext)
    const [bgColor, setBgColor] = useState('#000')
    const [fontColor, setFontColor] = useState('#FFF')
    const [listView, setListView] = useState(false)
    const listRef = useRef(undefined)
    const row = useRef(undefined)
    const functionRef = useRef({changeIndex: props.changeIndex})
    const memos = useMemo(() => {
        return {
            chapters: props.chapters,
            bg: props.bg,
            font: props.font,
        }
    }, [props.chapters, props.bg, props.font])
    useEffect(() => {
        row.current = ({index, style}) => {
            return (
                <Center style={style} _hover={{cursor: 'pointer'}}
                        onMouseDown={(e) => {
                            e.preventDefault()
                        }}
                        onClick={() => {
                            setListView(false)
                            functionRef.current.changeIndex(index)
                        }}
                >
                    <p
                        style={{
                            width: '100%',
                            overflow: 'none',
                            whiteSpace: 'nowrap',
                            textOverflow: 'hidden',
                            textAlign: 'left',
                            fontSize: '24px'
                        }}>{memos.chapters[index]}</p>
                </Center>
            )
        }
    }, [memos.chapters])
    useEffect(() => {
        if (listView === true) {
            const el = document.querySelector(".IndexList")
            el.scrollTop = (index * 30)
            el.style.opacity = 1
        }
    }, [index, listView])

    useEffect(() => {
        setBgColor(memos.bg)
        setFontColor(memos.font)
    }, [memos.bg, memos.font])

    return (
        <Box className="IndexMenu" position={'relative'} margin={'0'} padding={'0'} display={'flex'}
             alignContent={"center"}>
            <Menu>
                <MenuButton
                    as={IconButton}
                    icon={<BsFillFileTextFill/>}
                    onClick={() => {
                        setListView(!listView)
                    }}
                    onBlur={() => {
                        setListView(false)
                    }}
                    bg={bgColor}
                    _focus={{}} _hover={{}}
                    aria-label={"IndexButton"}/>
            </Menu>
            {listView && <FixedSizeList className={"IndexList"} height={500} width={300} itemSize={30} ref={listRef}
                                        style={{
                                            cursor: 'pointer',
                                            position: 'absolute',
                                            top: '100%',
                                            right: '100%',
                                            zIndex: '100',
                                            backgroundColor: `${bgColor}`,
                                            color: `${fontColor}`,
                                            border: '1px solid',
                                            opacity: '0'
                                        }}
                                        itemCount={memos.chapters.length}>{row.current}</FixedSizeList>}
        </Box>
    )
}

function useFontSizeSelect(initFontSize) {
    const [selectFontSize, setSelectFontSize] = useState(false)
    const [fontSize, setFontSize] = useState(initFontSize)

    function openSelectFontSize() {
        setSelectFontSize(true)
    }

    function closeSelectFontSize() {
        setSelectFontSize(false)
    }

    return [selectFontSize, openSelectFontSize, closeSelectFontSize, fontSize, setFontSize]
}

export default NovelReadPage;
