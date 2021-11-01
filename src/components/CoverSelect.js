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
import {useEffect, useMemo, useState} from "react";
import LoadingPage from "./LoadingPage";

function CoverSelect(props) {
    let {isOpen, onOpen, onClose} = useDisclosure()
    // const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [fetchComplete, setFetchComplete] = useState(false)
    // const list = useMemo(() => {
    //     return (<img width={"150px"} height={"300px"} alt={"404"}/>)
    // }, [])
    // isOpen = props.isOpen
    // setIsOpen(true)
    isOpen = props.isOpen
    useEffect(() => {
        console.log('1')
        if (isOpen === true) {
            console.log('11')
            const option = {
                method: "POST",
                body: JSON.stringify({search_key: props.name}),
                contentType: "application/json"
            }
            fetch(window.serverURL + "search_cover", option).then((res) => {
                return {status: res.status, data: res.json()}
            }).then((obj) => {
                if(obj.status !== 200){
                   alert()
                }
                console.log(obj.status)
            })
            return () => {
                console.log('2');
            }
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
                            <Radio value="1"><Image width={"150px"} height={"300px"}
                                                    objectFit="fill"
                                                    src="https://1.bp.blogspot.com/-uSzn4eJ4Hck/YSn-qgKB6MI/AAAAAAACXnY/VgWM-v4pthsAmcXZ_Mjk7Jkn2E_0Y6tHwCLcBGAsYHQ/s400/Movavi_Picverse_20210828.png"
                                                    alt={"404"}/></Radio>
                            <Radio value="2"><Image width={"150px"} height={"300px"}
                                                    objectFit="fill"
                                                    src="https://1.bp.blogspot.com/-uSzn4eJ4Hck/YSn-qgKB6MI/AAAAAAACXnY/VgWM-v4pthsAmcXZ_Mjk7Jkn2E_0Y6tHwCLcBGAsYHQ/s400/Movavi_Picverse_20210828.png"
                                                    alt={"404"}/></Radio>
                            <Radio value="3"><Image width={"150px"} height={"300px"}
                                                    objectFit="fill"
                                                    src="https://1.bp.blogspot.com/-uSzn4eJ4Hck/YSn-qgKB6MI/AAAAAAACXnY/VgWM-v4pthsAmcXZ_Mjk7Jkn2E_0Y6tHwCLcBGAsYHQ/s400/Movavi_Picverse_20210828.png"
                                                    alt={"404"}/></Radio>
                            <Radio value="4"><Image width={"150px"} height={"300px"}
                                                    objectFit="fill"
                                                    src="https://1.bp.blogspot.com/-uSzn4eJ4Hck/YSn-qgKB6MI/AAAAAAACXnY/VgWM-v4pthsAmcXZ_Mjk7Jkn2E_0Y6tHwCLcBGAsYHQ/s400/Movavi_Picverse_20210828.png"
                                                    alt={"404"}/></Radio>
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