import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";

import { styled, Switch, Typography } from "@semoss/ui";

import { BlockDef } from "../../../../../store";
import { PathValue } from "../../../../../types";
import { useBlockSettings } from "../../../../../hooks";
import { getValueByPath } from "../../../../../utility";
import { EchartVisualizationBlockDef } from "../../VisualizationBlock";

//the wrapper container for holding legend tool
const StyledContainer = styled("div")<{
    display?: string;
    justifyContent?: string;
    padding?: string;
}>(({ theme, display, justifyContent, padding }) => ({
    width: "100%",
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    padding: padding ?? undefined,
}));

const StyledAxis = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
}));

const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "8px 16px",
    alignItems: "center",
    gap: gap ?? undefined,
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.primary,
}));

//legend component props
interface legendProps {
    id: string;
}
//Legend component
export const Legend = observer(
    <D extends BlockDef = BlockDef>({ id, path }) => {
        const { data, setData } =
            useBlockSettings<EchartVisualizationBlockDef>(id); //current chart's data option
        const [value, setValue] = useState({});
        const [isLegendShown, setIsLegendShown] = useState<boolean>(false);
        // get the value of the input (wrapped in usememo because of path prop)
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, path);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, path]).get();
        //update the value to the most recent value from the state
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        //retain the legend value from the current state
        useEffect(() => {
            const option =
                typeof value === "string" ? JSON.parse(value) : value;
            let legendShown = isLegendShown;
            if (option.hasOwnProperty("legend") && option["legend"]) {
                legendShown = option["legend"].hasOwnProperty("show")
                    ? option["legend"]["show"]
                    : false;
            }
            setIsLegendShown(legendShown);
        }, []);
        //handles legend toggle input changes
        function handleInputChange(fieldName, newVal) {
            setIsLegendShown((prevProps) => {
                return newVal;
            });
            let option = typeof value === "string" ? JSON.parse(value) : value;
            if (option["legend"]) {
                option = {
                    ...option,
                    ["legend"]: {
                        ...option["legend"],
                        ["show"]: !option["legend"]["show"],
                    },
                };
            } else {
                option = {
                    ...option,
                    ["legend"]: {
                        type: "plain",
                        show: true,
                    },
                };
            }
            option = {
                ...option,
                ["customSettings"]: {
                    ...option["customSettings"],
                    ["toolsUpdated"]: true,
                },
            };
            runStateUpdateCustom(option);
        }
        //updating the state of Block with a debounce time
        function runStateUpdateCustom(
            updatedOption: PathValue<D["data"], typeof path>,
        ) {
            setTimeout(() => {
                try {
                    setData(
                        "option",
                        updatedOption as PathValue<D["data"], typeof path>,
                    );
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        return (
            <StyledAxis>
                <StyledAxisDiv
                    display="flex"
                    justifyContent="flex-start"
                    gap="8px"
                >
                    <Switch
                        size="small"
                        checked={isLegendShown}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                            handleInputChange(
                                "isLegendShown",
                                e.target.checked,
                            );
                        }}
                        title="Show Legend"
                    />
                    <StyledTypography variant="body2">
                        Show Legend
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxis>
        );
    },
);
