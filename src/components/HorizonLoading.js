import {Box, Center} from "@chakra-ui/react";
import "./css/HorizonLoading.css"

function HorizonLoading() {
    return (
        <Center className={"HorizonLoading"}>
            <Box className={"HorizonLoadingBox"} border={"#DBB256 1px solid"}/>
        </Center>
    )
}

export default HorizonLoading