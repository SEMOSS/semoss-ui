import { useBlockSettings } from "../../../../../hooks";
import { Block, BlockDef } from "../../../../../store";
import { Paths, PathValue } from "../../../../../types";
import { getValueByPath } from "../../../../../utility";
import { styled, Switch, Typography } from "@semoss/ui";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
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
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
}));
const StyledTypography = styled(Typography)({
    paddingLeft: "10px",
});

export const LegendToggleMapChart = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showLegend, setShowLegend] = useState(true);
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
            if (options.hasOwnProperty("legend")) {
                setShowLegend(options["legend"]["show"]);
            }
        };
        //Handle the change event for the toggle switch
        const handleLegend = (e) => {
            const option = JSON.parse(value);
            setShowLegend(!showLegend);
            option["legend"]["show"] = e.target.checked;
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showLegend}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleLegend(e)
                        }
                        title="Show Legend"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Show Legend
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxisDiv>
        );
    },
);
