import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { styled, Switch, Typography } from "@semoss/ui";

import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";

interface JsonSettingsProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    path: Paths<Block<D>["data"], 4>;
}
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

export const CustomTooltip = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showTooltips, setShowTooltip] = useState(true);
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
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue, data]);
        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                reInitializeFeatures(data.option);
            }
        }, [id]);
        //Reinitialize the feature when the chart is loaded
        const reInitializeFeatures = (options) => {
            if (options.hasOwnProperty("tooltip")) {
                setShowTooltip(options["tooltip"]["show"]);
            }
        };
        //Handle the change event for the toggle switch
        const showTooltip = (e) => {
            const option = JSON.parse(value);
            setShowTooltip(!showTooltips);
            option["tooltip"]["show"] = e.target.checked;
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" gap="8px">
                    <Switch
                        checked={showTooltips}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            showTooltip(e)
                        }
                        title="Show Tooltip"
                        size="small"
                    />
                    <StyledTypography variant="body2">
                        Show Tooltip
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxisDiv>
        );
    },
);
