import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react-lite";
import { computed } from "mobx";

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
}>(({ display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "0.5rem",
}));

const StyledTypography = styled(Typography)({
    paddingLeft: "10px",
});

export const ToogleDonut = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showDonut, setShowDonut] = useState(false);
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
                reinitializeFeatures(data.option);
            }
        }, [id]);
        //Reinitialize the feature when the chart is loaded
        const reinitializeFeatures = (options) => {
            if (typeof options["series"][0].radius === "string") {
                setShowDonut(false);
            } else {
                setShowDonut(true);
            }
        };
        //Handle the change event for the toggle switch
        const handleDonut = (e) => {
            const option = JSON.parse(value);
            setShowDonut(!showDonut);
            if (e.target.checked) {
                option["series"][0].radius = ["20%", "50%"];
            } else {
                option["series"][0].radius = "50%";
            }
            option["tooltip"]["show"] = e.target.checked;
            setData(path, option as PathValue<D["data"], typeof path>);
        };
        return (
            <StyledAxisDiv>
                <StyledAxisDiv display="flex" justifyContent="flex-start">
                    <Switch
                        checked={showDonut}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleDonut(e)
                        }
                        title="Toggle Donut"
                        size="small"
                    />
                    <StyledTypography variant="body1">
                        Toggle ON / OFF
                    </StyledTypography>
                </StyledAxisDiv>
            </StyledAxisDiv>
        );
    },
);
