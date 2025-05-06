import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { Box, Slider, styled } from "@semoss/ui";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { debounced } from "../../../utility";

const StyledSliderBox = styled(Box, {
    shouldForwardProp: (prop) => prop !== "sliderColor",
})<{ sliderColor: string }>(({ theme, sliderColor }) => ({
    display: "flex",
    alignItems: "center",
    "&.MuiSlider-root": {
        color: sliderColor,
    },
}));

export interface SliderBlockDef extends BlockDef<"slider"> {
    widget: "slider";
    data: {
        type: "continuous" | "discrete";
        style: CSSProperties;
        value: number;
        steps: number;
        min: number;
        max: number;
        size: string;
        marks: Array<{ display: string; value: number }>;
    };
    listeners: {
        preProcess: true;
        onChange: true;
    };
}

export const SliderBlock: BlockComponent = observer(({ id }) => {
    const { data, attrs, setData, listeners } = useBlock<SliderBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const debouncedCallback = debounced(() => {
        listeners.onChange();
    }, 200);

    const formatMarks = (marks: Array<{ display: string; value: number }>) => {
        return marks.map(({ display, value }) => ({
            label: display,
            value: Number(value) || value,
        }));
    };

    const hasMarks = data.type === "discrete" && data.marks.length > 0;
    const marksValue = hasMarks ? formatMarks(data.marks) : true;

    return (
        <StyledSliderBox
            sx={{ width: data.size }}
            {...attrs}
            sliderColor={data.style.color}
        >
            <Slider
                sx={{ ...data.style }}
                value={Number(data.value) ?? 0}
                marks={data.type === "continuous" ? false : marksValue}
                step={Number(data.steps) > 0 ? Number(data.steps) : 1}
                min={Number(data.min)}
                max={Number(data.max)}
                onChange={(e) => {
                    // update the value
                    setData("value", e.target.value);
                    debouncedCallback();
                }}
                valueLabelDisplay="auto"
            />
        </StyledSliderBox>
    );
});
