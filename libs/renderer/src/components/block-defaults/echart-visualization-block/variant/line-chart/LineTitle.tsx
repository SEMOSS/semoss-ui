import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import {
    styled,
    Switch,
    TextField,
    Select,
    Button,
    Typography,
} from "@semoss/ui";

import {
    FontFamily,
    FontWeights,
    Title_Alignment,
} from "../../Visualization.constants";
import { ColorPickerSettings } from "../../../../block-settings/shared/ColorPickerSettings";
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
const StyledAxis = styled("div")<{
    display?: string;
    justifyContent?: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
}));
const StyledButtonWrapper = styled("div")({
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 16px",
});
const StyledAxisColDiv = styled("div")<{
    display?: string;
    justifyContent: string;
}>(({ theme, display, justifyContent }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "column",
    padding: "8px 16px",
    gap: "8px",
    marginBottom: "8px",
}));
const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));
const StyledSelect = styled(Select)(() => ({
    width: "100%",
}));
export const LineTitle = observer(
    <D extends BlockDef = BlockDef>({ id, path }: JsonSettingsProps<D>) => {
        const { data, setData } = useBlockSettings<D>(id);
        const [value, setValue] = useState("");
        const [showTitle, setShowTitle] = useState(true);
        const [title, setTitle] = useState({
            name: "",
            alignment: "center",
            size: 8,
            weight: "normal",
            family: "",
            color: "#000000",
        });
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
        useEffect(() => {
            if (data.hasOwnProperty("option")) {
                retainLocalState(data.option);
            }
        }, [showTitle]);
        /**
         * Retains the local state of the feature on toggle switch and on reset button
         * With the local state we will be displaying the values in the fields
         */
        const retainLocalState = (options) => {
            setTitle((prev) => ({
                // Retain the title name
                name: options["title"]["text"],
                // Retain the alignment of the title
                alignment: options["title"]["left"],
                // Retain the font size of the title
                size: options["title"]["textStyle"]["fontSize"],
                // Retain the font weight of the title
                weight: options["title"]["textStyle"]["fontWeight"],
                // Retain the font family of the title
                family: options["title"]["textStyle"]["fontFamily"],
                // Retain the color of the title
                color: options["title"]["textStyle"]["color"],
            }));
        };
        //Reinitialize the feature when the chart is loaded
        const reInitializeFeatures = (options) => {
            setShowTitle(options["title"].show ?? true);
        };
        /**
         * Handle the change event for any Title input
         * @param title - name of the input field
         * @param inputValue - value of the input field
         */
        function handleInputChange(title: string, inputValue) {
            const option = JSON.parse(value);
            if (title === "showTitle") {
                // Update the showTitle property of the option
                option["title"].show = inputValue;
                // Update the showTitle state
                setShowTitle(inputValue);
            } else if (title === "titleName") {
                // Update the titleName property of the option
                option["title"]["text"] = inputValue;
                // Update the titleName state
                setTitle((prev) => ({
                    ...prev,
                    name: inputValue,
                }));
            } else if (title === "titleAlignment") {
                // Update the titleAlignment property of the option
                option["title"]["left"] = inputValue;
                // Update the titleAlignment state
                setTitle((prev) => ({
                    ...prev,
                    alignment: inputValue,
                }));
            } else if (title === "titleSize") {
                // Update the titleSize property of the option
                option["title"]["textStyle"]["fontSize"] = inputValue;
                // Update the titleSize state
                setTitle((prev) => ({
                    ...prev,
                    size: inputValue,
                }));
            } else if (title === "titleWeight") {
                // Update the titleWeight property of the option
                option["title"]["textStyle"]["fontWeight"] = inputValue;
                // Update the titleWeight state
                setTitle((prev) => ({
                    ...prev,
                    weight: inputValue,
                }));
            } else if (title === "titleFamily") {
                // Update the titleFamily property of the option
                option["title"]["textStyle"]["fontFamily"] = inputValue;
                // Update the titleFamily state
                setTitle((prev) => ({
                    ...prev,
                    family: inputValue,
                }));
            }
            // Update the data with the new option
            setData(path, option as PathValue<D["data"], typeof path>);
        }
        /**
         * Resets the title feature to its default values.
         * Default values are defined in the 'reset' object of the option.
         */
        function handleReset() {
            // Parse the current option value
            const option = JSON.parse(value);
            // Reset show property of the title
            option["title"].show = option["reset"]["title"]["show"];
            // Reset text property of the title
            option["title"]["text"] = option["reset"]["title"]["text"];
            // Reset alignment of the title
            option["title"]["left"] = option["reset"]["title"]["left"];
            // Reset font size of the title
            option["title"]["textStyle"]["fontSize"] =
                option["reset"]["title"]["textStyle"]["fontSize"];
            // Reset font weight of the title
            option["title"]["textStyle"]["fontWeight"] =
                option["reset"]["title"]["textStyle"]["fontWeight"];
            // Reset font family of the title
            option["title"]["textStyle"]["fontFamily"] =
                option["reset"]["title"]["textStyle"]["fontFamily"];
            // Reset color of the title
            option["title"]["textStyle"]["color"] =
                option["reset"]["title"]["textStyle"]["color"];
            // Update the data with the reset option
            setData(path, option as PathValue<D["data"], typeof path>);
            // Retain the local state with the updated option
            retainLocalState(option);
        }
        return (
            <StyledAxis>
                <StyledAxisDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                >
                    <Switch
                        size="small"
                        checked={showTitle}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange("showTitle", e.target.checked)
                        }
                        title="Show Title"
                    />
                    <Typography variant="body2" color="secondary">
                        Show Title
                    </Typography>
                </StyledAxisDiv>
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Title Name
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="name"
                            name="name"
                            value={title?.name}
                            onChange={(e) =>
                                handleInputChange("titleName", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Select Alignment
                        </Typography>
                        <StyledSelect
                            size="small"
                            id="alignment"
                            name="alignment"
                            value={title?.alignment}
                            onChange={(e) =>
                                handleInputChange(
                                    "titleAlignment",
                                    e.target.value,
                                )
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {Title_Alignment.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Text Size
                        </Typography>
                        <StyledTextField
                            size="small"
                            id="size"
                            name="size"
                            value={title?.size}
                            onChange={(e) =>
                                handleInputChange("titleSize", e.target.value)
                            }
                        />
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Select Font Weight
                        </Typography>
                        <StyledSelect
                            size="small"
                            id="font-weight"
                            name="fontWeight"
                            value={title?.weight}
                            onChange={(e) =>
                                handleInputChange("titleWeight", e.target.value)
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {FontWeights.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <StyledAxisColDiv
                        display="flex"
                        justifyContent="space-around"
                    >
                        <Typography variant="body2" color="secondary">
                            Select Font Family
                        </Typography>
                        <StyledSelect
                            size="small"
                            id="font-family"
                            name="fontFamily"
                            value={title?.family}
                            onChange={(e) =>
                                handleInputChange("titleFamily", e.target.value)
                            }
                        >
                            <Select.Item key="-1" value="">
                                Select
                            </Select.Item>
                            {FontFamily.map((label, index) => {
                                return (
                                    <Select.Item value={label} key={index}>
                                        {label}
                                    </Select.Item>
                                );
                            })}
                        </StyledSelect>
                    </StyledAxisColDiv>
                )}
                {showTitle && (
                    <ColorPickerSettings
                        id={id}
                        path="option.title.textStyle.color"
                        colorValue={title.color}
                        onChange={(e) => handleInputChange("titleColor", e)}
                    />
                )}
                {showTitle && (
                    <StyledButtonWrapper>
                        <Button
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={handleReset}
                        >
                            Reset
                        </Button>
                    </StyledButtonWrapper>
                )}
            </StyledAxis>
        );
    },
);
