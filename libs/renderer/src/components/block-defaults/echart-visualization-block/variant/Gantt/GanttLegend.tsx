import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { styled, Switch } from "@semoss/ui";
import { getValueByPath } from "@/utility";
import { useBlockSettings } from "../../../../../hooks";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";
import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";

interface GanttLegendProps {
    id: string;
}
//styled main container with padding and border
const StyledMainContainer = styled("div")(({}) => ({
    padding: "0.5rem",
    borderBottom: "1px solid #E6E6E6",
}));
// styled label with padding left
const StyledLabel = styled("label")(({}) => ({
    paddingLeft: "10px",
}));
export const GanttLegend = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //block data
        const [legendData, setLegendData] = useState(false); //legend component data
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
        //to retain the values from state
        useEffect(() => {
            const parsedJson = JSON.parse(computedValue);
            if (parsedJson["customSettings"]?.["gantttools"]?.["showLegend"]) {
                setLegendData((prevLegendData) => {
                    return parsedJson["customSettings"]["gantttools"][
                        "showLegend"
                    ];
                });
            }
        }, []);
        //update the fields and also the state when legend fields are changed
        function updateFields(e) {
            setLegendData((prevLegendData) => e.target.checked);
            let option = JSON.parse(computedValue);
            option = {
                ...option,
                ["customSettings"]: {
                    ...option["customSettings"],
                    ["gantttools"]: {
                        ...option["customSettings"]["gantttools"],
                        ["showLegend"]: e.target.checked,
                    },
                },
            };
            runStateUpdateCustom(option);
        }
        //run the state update when fields in legend are changed
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
                        checked={legendData}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            updateFields(e)
                        }
                    />
                    <StyledLabel>Show Legend</StyledLabel>
                </StyledMainContainer>
            </>
        );
    },
);
