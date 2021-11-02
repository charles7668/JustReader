import {
    Button, Image,
    Modal,
    ModalBody, ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay, Radio, RadioGroup, Stack,
    useDisclosure
} from "@chakra-ui/react";
import {useEffect, useRef, useState} from "react";
import LoadingPage from "./LoadingPage";

function CoverSelect(props) {
    let {isOpen} = useDisclosure()
    const [isLoading, setIsLoading] = useState(true)
    const [submitLoading, setSubmitLoading] = useState(false)
    const selectedRef = useRef(0)
    const radioListRef = useRef([])
    const onSubmitRef = useRef((rowID) => {
            setSubmitLoading(true)
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
                }, 100)
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
            const option = {
                method: "POST",
                body: JSON.stringify({search_key: props.name}),
                contentType: "application/json"
            }
            fetch(window.serverURL + "search_cover", option).then((res) => {
                return {status: res.status, data: res.json()}
            }).then(async (obj) => {
                if (obj.status !== 200) {
                    alert(obj.data.message)
                    return
                }
                const list = await obj.data
                if (list === null) {
                    radioListRef.current = undefined
                } else {
                    radioListRef.current = list.map((url, index) => {
                        return (
                            <Radio value={index} onChange={() => selectedRef.current = url}>
                                <Image
                                    width={"250px"}
                                    height={"300px"}
                                    src={url}
                                    alt={"404"}/>
                            </Radio>
                        )
                    })
                }
                setIsLoading(false)
            }).catch(() => {
                    radioListRef.current = undefined
                    setIsLoading(false)
                }
            )
            return () => {
            }
        } else {
            setIsLoading(true)
        }
    }, [isOpen, props.name])

    return (
        <Modal isOpen={isOpen} onClose={props.onClose} closeOnOverlayClick={false} scrollBehavior={"inside"}>
            <ModalOverlay/>
            <ModalContent>
                <ModalHeader>封面選擇</ModalHeader>
                <ModalBody>
                    {isLoading && <LoadingPage height={"100px"} backgroundColor={"transparent"} text="loading"/>}
                    {!isLoading &&
                    <RadioGroup defaultValue="1" defaultChecked={"true"}>
                        <Stack>
                            {radioListRef.current}
                        </Stack>
                    </RadioGroup>
                    }
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