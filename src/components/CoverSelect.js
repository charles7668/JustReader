import {
    Button, Image,
    MenuItem,
    Modal,
    ModalBody, ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay, Radio, RadioGroup, Stack,
    useDisclosure
} from "@chakra-ui/react";
import {useEffect, useMemo, useRef, useState} from "react";
import LoadingPage from "./LoadingPage";

function CoverSelect(props) {
    let {isOpen} = useDisclosure()
    const [isLoading, setIsLoading] = useState(true)
    // const [fetchComplete, setFetchComplete] = useState(false)
    const radioListRef = useRef([])
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
                            <Radio value={index}> <Image width={"150px"} height={"300px"} src={url} alt={"404"}/>
                            </Radio>
                        )
                    })
                }
                setIsLoading(false)
            })
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
                    <RadioGroup defaultValue="1">
                        <Stack>
                            {radioListRef.current}
                        </Stack>
                    </RadioGroup>
                    }
                </ModalBody>
                <ModalFooter>
                    <Button colorScheme="blue" mr={3} onClick={props.onClose}>
                        Close
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>)
}

export default CoverSelect