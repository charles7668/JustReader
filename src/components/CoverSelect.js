import {
    Button, Image, Modal,
    ModalBody, ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay, Radio, RadioGroup, Stack,
    useDisclosure
} from "@chakra-ui/react";
import {useContext, useEffect, useRef, useState} from "react";
import {AlertContext} from "../App";
import HorizonLoading from "./HorizonLoading";

function CoverSelect(props) {
    let {isOpen} = useDisclosure()
    const [isLoading, setIsLoading] = useState(false)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [radioList, setRadioList] = useState(undefined)
    const alert = useContext(AlertContext)
    const selectedRef = useRef(0)
    const runningStateRef = useRef(false)
    const listRef = useRef([])
    const onSubmitRef = useRef((rowID) => {
            setSubmitLoading(true)
            fetch(window.serverURL + "search_cover/stop", {method: "POST"}).then(r => r)
            const option = {
                method: "POST",
                body: JSON.stringify({url: selectedRef.current})
            }
            fetch(window.serverURL + "use_net_image/" + rowID, option).then((res) => res.json()).then((data) => {
                alert(data.message)
                setTimeout(() => {
                    props.updateCover(rowID)
                    setSubmitLoading(false)
                    props.onClose()
                }, 300)
            }).catch((err) => {
                alert(err)
                setSubmitLoading(false)
                props.onClose()
            })
        }
    )
    isOpen = props.isOpen
    useEffect(() => {
        if (isOpen === true) {
            listRef.current = []
            const searchCover = () => {
                setIsLoading(true)
                runningStateRef.current = true
                const getCoverList = (list) => {
                    return fetch(window.serverURL + "search_cover/get", {method: "POST"}).then((res) => res.json()).then((data) => {
                        if (data !== null) {
                            for (let i = 0; i < data.length; i++) {
                                list.push(data[i])
                            }
                            setRadioList(list.map((url, index) => {
                                return (
                                    <Radio key={url} value={index} onChange={() => selectedRef.current = url}>
                                        <Image
                                            width={"250px"}
                                            height={"300px"}
                                            src={url}
                                            alt={"404"}/>
                                    </Radio>
                                )
                            }))
                        }
                    })
                }
                const option = {
                    method: "POST",
                    body: JSON.stringify({search_key: props.name}),
                    contentType: "application/json"
                }
                fetch(window.serverURL + "search_cover", option).then((res) => {
                    return {status: res.status, data: res.json()}
                }).then(async (obj) => {
                    if (obj.status !== 200) {
                        obj.data.then((message) => {
                            alert(message.message)
                            runningStateRef.current = false
                            setIsLoading(false)
                        })
                    } else {
                        obj.data.then((message) => {
                            if (message.status === 3) {
                                getCoverList(listRef.current).then(() => {
                                    setTimeout(searchCover, 1000)
                                })
                            } else if (message.status === 4) {
                                getCoverList(listRef.current).then(() => {
                                    runningStateRef.current = false
                                    setIsLoading(false)
                                })
                            }
                        });
                    }
                })
            }
            searchCover()
            return () => {
            }
        } else {
            setIsLoading(false)
            setRadioList(undefined)
        }
    }, [alert, isOpen, props.name])

    return (
        <Modal isOpen={isOpen} onClose={props.onClose} closeOnOverlayClick={false} scrollBehavior={"inside"}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>封面選擇
                    {isLoading && <HorizonLoading/>}
                </ModalHeader>
                <ModalBody>
                    <RadioGroup position={"relative"}>
                        <Stack>
                            {radioList}
                        </Stack>
                    </RadioGroup>
                </ModalBody>
                <ModalFooter>
                    <Button isLoading={submitLoading} colorScheme="blue"
                            onClick={() => onSubmitRef.current(props.rowID)}
                            marginRight={"5px"}>確定</Button>
                    <Button colorScheme="blue" mr={3} onClick={props.onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>)
}

export default CoverSelect