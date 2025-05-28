import { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import * as echarts from "echarts";
import { Label } from "@mui/icons-material";
import { Button, styled, TextField } from "@semoss/ui";

const StyledDataContainer = styled("div", {
    shouldForwardProp: (prop) => prop !== "error",
})<{ error?: boolean }>(({ error = false, theme }) => ({
    height: "30vh",
    width: "60vw",
    color: error ? theme.palette.error.main : "unset",
}));

const StyledDataSection = styled("div")(({}) => ({
    display: "flex",
    alignContent: "center",
}));
interface MapToolProps {
    id: string;
}
const workingPage = "page-1";
export const MapTool = observer<MapToolProps>(({ id }) => {
    const ElementWidth = document.querySelector(
        `div#${workingPage} div[data-block="${id}"]`,
    ).clientWidth;
    const ElementHeight = document.querySelector(
        `div#${workingPage} div[data-block="${id}"]`,
    ).clientHeight;
    const [dataElementWidth, setDataElementWidth] = useState(ElementWidth);
    const [dataElementHeight, setDataElementHeight] = useState(ElementHeight);
    const echartInstance = useRef(null);

    useEffect(() => {
        const dataBlockWidth = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientWidth;
        const dataBlockHeight = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientHeight;
        setDataElementWidth((prevWidth) => {
            return dataBlockWidth;
        });
        setDataElementHeight((prevHeight) => {
            return dataBlockHeight;
        });
        const workingPageElement = document.getElementById(workingPage);
        let canvasElement: any =
            workingPageElement.getElementsByTagName("CANVAS")[0] || null;
        if (canvasElement === null) return;
        let instance = null;
        while (instance == null) {
            const instanceReceived = echarts.getInstanceByDom(canvasElement);
            if (instanceReceived) {
                instance = instanceReceived;
                if (canvasElement.id === id) {
                    instance = null;
                }
                break;
            }
            canvasElement = canvasElement.parentElement;
        }
        echartInstance.current = instance;
    }, []);

    function getAndUpdateWidth(e) {
        const existingWidth = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientWidth;
        setDataElementWidth((prevWidth) => {
            return e.target.value;
        });
    }

    function getAndUpdateHeight(e) {
        const existingHeight = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ).clientHeight;
        setDataElementHeight((prevHeight) => {
            return e.target.value;
        });
    }

    function updateElementWidth() {
        const dataBlockElement = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ) as HTMLElement;
        const dataBlockIdElement = document.querySelector(
            `div#${workingPage} div[data-block-id="${id}"]`,
        ) as HTMLElement;
        updateElementHeight();
    }
    function updateElementHeight() {
        const dataBlockElement = document.querySelector(
            `div#${workingPage} div[data-block="${id}"]`,
        ) as HTMLElement;
        const dataBlockIdElement = document.querySelector(
            `div#${workingPage} div[data-block-id="${id}"]`,
        ) as HTMLElement;
        console.log(echartInstance.current);
        // setTimeout(()=>{
        //     dataBlockElement.style.height = dataElementHeight+'px';
        //     dataBlockIdElement.style.height = dataElementHeight+'px';
        // },200);
        echartInstance.current?.resize({
            width: dataElementWidth,
            height: dataElementHeight,
            animation: {
                duration: 100,
                // easing: '',
            },
        });
        setTimeout(() => {
            dataBlockElement.style.width = dataElementWidth + "px";
            dataBlockIdElement.style.width = dataElementWidth + "px";
            dataBlockElement.style.height = dataElementHeight + "px";
            dataBlockIdElement.style.height = dataElementHeight + "px";
        }, 200);
    }

    return (
        <StyledDataContainer data-block={id}>
            <StyledDataSection>
                {/* <Label>Please enter Width</Label> */}
                <TextField
                    id="width-field"
                    label="Enter Width"
                    type="number"
                    defaultValue={dataElementWidth}
                    onChange={getAndUpdateWidth}
                />
            </StyledDataSection>
            <StyledDataSection>
                {/* <Label>Please enter Height</Label> */}
                <TextField
                    id="demo-helper-text-misaligned"
                    label="Enter Height"
                    type="number"
                    defaultValue={dataElementHeight}
                    onChange={getAndUpdateHeight}
                />
            </StyledDataSection>
            <StyledDataSection>
                <Button
                    onClick={updateElementWidth}
                    aria-label="Update Width and Height"
                >
                    Update Width and Height
                </Button>
            </StyledDataSection>
        </StyledDataContainer>
    );
});
