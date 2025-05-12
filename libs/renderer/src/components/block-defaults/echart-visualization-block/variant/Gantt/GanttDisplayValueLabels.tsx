import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import { styled, Switch } from "@semoss/ui";

import { getValueByPath } from "../../../../../utility";
import { PathValue } from "@/types";
import { useBlockSettings } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../../echart-visualization-blocks/VisualizationBlock";
import { BlockDef } from "../../../../../store";
//main container with default padding and border
const StyledMainContainer = styled("div")(({}) => ({
    padding: "0.5rem",
    borderBottom: "1px solid #E6E6E6",
}));
//label with default padding towards left
const StyledLabel = styled("label")(({}) => ({
    paddingLeft: "10px",
}));
export const GanttDisplayValueLabels = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //block data
        const [displayValueLabelsData, setDisplayValueLabelsData] =
            useState(false); //display value labels state
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null); //timeout ref for setting data
        //get the computed value of the block data
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, "option");
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, "option"]).get();
        // retain the values of the display value labels
        useEffect(() => {
            const parsedJson = JSON.parse(computedValue);
            if (
                parsedJson["customSettings"]?.["gantttools"]?.[
                    "showDisplayValueLabels"
                ]
            ) {
                setDisplayValueLabelsData((prevDisplayValueLabelsData) => {
                    return parsedJson["customSettings"]["gantttools"][
                        "showDisplayValueLabels"
                    ];
                });
            }
        }, []);
        //update fields when display value labels is changed
        function updateFields(e) {
            setDisplayValueLabelsData(
                (prevDisplayValueLabelsData) => e.target.checked,
            );
            let option = JSON.parse(computedValue);
            option = {
                ...option,
                ["customSettings"]: {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["showDisplayValueLabels"]: e.target.checked,
                    },
                },
            };
            runStateUpdateCustom(option);
        }
        //run state update when display value labels is changed
        function runStateUpdateCustom(option) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        "option",
                        option as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        return (
            <>
                <StyledMainContainer>
                    <Switch
                        checked={displayValueLabelsData}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields(e)
                        }
                    />
                    <StyledLabel>Show Display Value Labels</StyledLabel>
                </StyledMainContainer>
            </>
        );
    },
);
