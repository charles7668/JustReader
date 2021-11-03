// noinspection JSUnresolvedVariable

import {useEffect, useRef, useState} from "react";
import {
    AlertDialog as ChakraAlertDialog,
    AlertDialogBody,
    AlertDialogContent, AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay, Button
} from "@chakra-ui/react";

export function useAlert() {
    const [isOpen, setIsOpen] = useState(false)
    const [alertInformation, setAlertInformation] = useState({alertTitle: "alert", alertMessage: "alert"})
    const alert = (message, title = "alert") => {
        setAlertInformation({alertTitle: title, alertMessage: message})
        setIsOpen(true)
    }
    const closeAlert = () => setIsOpen(false)
    return [isOpen, alertInformation.alertTitle, alertInformation.alertMessage, alert, closeAlert]
}


function Alert(props) {
    const cancelRef = useRef()
    const [isOpen, setIsOpen] = useState()
    useEffect(() => {
        setIsOpen(props.isOpen)
    }, [props.isOpen])
    return (
        <ChakraAlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={() => {
                props.closeAlert();
                setIsOpen(false)
            }}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {props.alertTitle}
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        {props.alertMessage}
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={() => {
                            props.closeAlert();
                            setIsOpen(false)
                        }}>
                            close
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </ChakraAlertDialog>
    )
}

export function useAlertDialog() {
    const [isOpen, setIsOpen] = useState(false)
    const [alertInformation, setAlertInformation] = useState({
        alertTitle: "alert",
        alertMessage: "alert",
        okAction: undefined,
        cancelAction: undefined
    })
    const alert = (message, title = "alert", okAction = undefined, cancelAction = undefined) => {
        setAlertInformation({alertTitle: title, alertMessage: message, okAction: okAction, cancelAction: cancelAction})
        setIsOpen(true)
    }
    const closeAlert = () => setIsOpen(false)
    return [isOpen, alertInformation.alertTitle, alertInformation.alertMessage, alertInformation.okAction, alertInformation.cancelAction, alert, closeAlert]
}

export function AlertDialog(props) {
    const cancelRef = useRef()
    const [isOpen, setIsOpen] = useState()
    useEffect(() => {
        setIsOpen(props.isOpen)
    }, [props.isOpen])
    return (
        <ChakraAlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={() => setIsOpen(false)}
        >
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        {props.alertTitle}
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        {props.alertMessage}
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button onClick={() => {
                            props.okAction()
                            props.closeAlert()
                            setIsOpen(false)
                        }}>
                            OK
                        </Button>
                        <Button ref={cancelRef} onClick={() => {
                            props.cancelAction()
                            props.closeAlert()
                            setIsOpen(false)
                        }}>
                            close
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </ChakraAlertDialog>
    )
}

export default Alert