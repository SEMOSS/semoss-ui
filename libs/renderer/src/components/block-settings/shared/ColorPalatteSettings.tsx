import { useEffect, useMemo, useRef, useState, MouseEvent } from "react";
import { computed } from "mobx";
import { observer } from "mobx-react-lite";
import { SketchPicker } from "react-color";
import { OutlinedInput } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import {
    ArrowBack,
    Check,
    Close,
    Delete,
    Edit,
    FormatColorFill,
} from "@mui/icons-material";

import {
    Button,
    IconButton,
    InputAdornment,
    styled,
    TextField,
    Icon,
    Typography,
} from "@semoss/ui";

import { Paths, PathValue } from "../../../types";
import { useBlockSettings } from "../../../hooks";
import { getValueByPath } from "../../../utility";
import { Block, BlockDef } from "../../../store";
import { EchartVisualizationBlockDef } from "../../block-defaults/echart-visualization-block";

interface ColorPalatteSettingProps<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;
    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
    onColorPalatteSelected: (option, color) => void;
}
const StyledButton = styled(Button)(({}) => ({
    justifyContent: "center",
    display: "flex",
}));
const StyledTextField = styled(TextField)(({}) => ({
    display: "flex",
}));
const StyledOutlinedInput = styled(OutlinedInput)(({}) => ({
    display: "flex",
}));
const StyledEditIcon = styled(Edit)(({}) => ({
    width: "33px",
    height: "33px",
    borderRadius: "20%",
    display: "block",
}));
const StyledIconButtonEdit = styled(IconButton)(({}) => ({
    padding: "0px",
}));
const StyledRowColorEditButton = styled(IconButton)(({}) => ({
    marginLeft: "auto",
    marginRight: "0px",
}));
const StyledFormatColorFill = styled(FormatColorFill)(({}) => ({
    width: "33px",
    height: "33px",
    borderRadius: "20%",
    display: "block",
}));
const StyledDeleteIcon = styled(Delete)(({}) => ({
    width: "33px",
    height: "33px",
    borderRadius: "20%",
    display: "block",
}));
const StyledPicker = styled(SketchPicker)(({}) => ({
    width: "97% !important",
    margin: "10px",
    boxShadow:
        "rgba(0, 0, 0, 0) 0px 0px 0px 1px, rgba(0, 0, 0, 0) 0px 8px 16px !important",
    padding: "0px !important",
}));
const StyledEmptyContainer = styled("div")(() => ({}));
const StyledPaletteContainer = styled("div")(() => ({
    display: "inline-block",
    borderRadius: "10px",
    border: "1px solid #ddd",
    margin: "20px",
    paddingRight: "10px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
}));
const StyledColorPalete = styled("div")(() => ({
    display: "inline-block",
    borderRadius: "10px",
    border: "1px solid #ddd",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    textAlign: "center",
    backgroundColor: "#fff",
    width: "120px",
    height: "60px",
    cursor: "pointer",
    margin: "5px",
}));
const StyledPaleteRow = styled("div")(() => ({
    display: "flex",
    overflow: "hidden",
    borderTopLeftRadius: "10px",
    borderTopRightRadius: "10px",
}));
const StyledPalete = styled("div")(() => ({
    flex: 1,
    height: "27px",
}));
const StyledOverlay = styled("div")(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "fit-content",
    borderRadius: "12px",
}));
const StyledModel = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    width: "fit-content",
}));
const StyledHeader = styled("div")(() => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
}));
const StyledTitle = styled("span")(() => ({
    fontSize: "16px",
}));
const StyledCustomPaletteAdd = styled("div")(() => ({
    display: "flex",
    justifyContent: "center",
    padding: "16px",
    // paddingTop: "10px",
}));
const StyledCustomPaletteEdit = styled("div")(() => ({
    // display: "block",
    display: "flex",
    justifyContent: "center",
    flexWrap: "wrap",
}));
const StyledButtonClose = styled(Button)(() => ({
    background: "transparent",
    border: "none",
    fontSize: "14px",
    cursor: "pointer",
    color: "#666",
    marginRight: "5px",
}));
const StyledButtonAdd = styled(Button)(() => ({
    background: "#007AFF",
    color: "#fff",
    fontSize: "14px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    marginRight: "5px",
}));
const StyledCheck = styled(Button)(() => ({
    fontSize: "20px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
}));
const StyledButtonContainer = styled("div")(() => ({
    display: "flex",
    justifyContent: "flex-end",
    padding: "8px 16px",
}));
const StyledPaleteLabel = styled("div")(() => ({
    fontSize: "14px",
    fontWeight: "normal",
}));

const StyledColorSpan = styled("span")(() => ({ marginLeft: "20px" }));
const StyledRowSection = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "8px 16px",
    marginBottom: "8px",
}));
const StyledContainerToggle = styled("div")(() => ({}));
const StyledSelectedColorContainer = styled("div")(() => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: "8px",
    borderRadius: "4px",
    marginBottom: "8px",
    marginLeft: "20px",
    marginRight: "20px",
}));
const StyledSelectedColorRow = styled("div")(() => ({
    width: "33px",
    height: "33px",
    borderRadius: "20%",
}));
/**
 * A component that renders a color palette with a label.
 * The color palette is rendered as a row of colored blocks.
 * The label is rendered below the color palette.
 * The component is also clickable, and when clicked, it calls the onClick function with the colors and label as arguments.
 * If the palette is a custom palette, it also renders an edit button next to the label.
 * @param {Object} props - The component props.
 * @prop {string[]} colors - The colors of the palette.
 * @prop {string} label - The label of the palette.
 * @prop {boolean} isCustom - Whether the palette is a custom palette.
 * @prop {function} onClick - The function to call when the palette is clicked.
 * @prop {function} onPaletteEditClick - The function to call when the edit button is clicked.
 */
const ColorPalette = ({
    colors,
    label,
    isCustom,
    onClick,
    onPaletteEditClick,
}) => {
    return (
        <StyledColorPalete onClick={() => onClick(label, colors)}>
            {/* Color palette row */}
            <StyledPaleteRow>
                {colors.map((color, index) => (
                    <StyledPalete
                        key={index}
                        style={{
                            backgroundColor: color,
                        }}
                    />
                ))}
            </StyledPaleteRow>
            {/* Label below the palette */}
            <StyledPaleteLabel>
                {label}{" "}
                {isCustom && (
                    <StyledIconButtonEdit
                        onClick={() => onPaletteEditClick(label, colors)}
                    >
                        <EditIcon />
                    </StyledIconButtonEdit>
                )}
            </StyledPaleteLabel>
        </StyledColorPalete>
    );
};
export const ColorPalatteSettings = observer(
    ({ id, path, onColorPalatteSelected }: ColorPalatteSettingProps) => {
        const { data: Data } =
            useBlockSettings<EchartVisualizationBlockDef>(id);
        const palettes = [
            {
                label: "Option 1",
                palatteLabel: "Option 1",
                isCustom: false,
                colors: [
                    "#007AFF",
                    "#FFEDE9",
                    "#FFE9E2",
                    "#FF00FF",
                    "#A0D8FF",
                    "#082B12",
                    "#A0FF5E",
                    "#22AFFF",
                ],
            },
            {
                label: "Option 2",
                palatteLabel: "Option 2",
                isCustom: false,
                colors: [
                    "#FF5733",
                    "#33FF57",
                    "#5733FF",
                    "#FF33A8",
                    "#33FFA8",
                    "#A833FF",
                    "#FFA833",
                    "#33A8FF",
                ],
            },
            {
                label: "Option 3",
                palatteLabel: "Option 3",
                isCustom: false,
                colors: [
                    "#000000",
                    "#444444",
                    "#888888",
                    "#BBBBBB",
                    "#DDDDDD",
                    "#FFFFFF",
                ],
            },
            {
                label: "Option 4",
                palatteLabel: "Option 4",
                isCustom: false,
                colors: [
                    "#FF0000",
                    "#00FF00",
                    "#0000FF",
                    "#FFFF00",
                    "#FF00FF",
                    "#00FFFF",
                    "#C0C0C0",
                    "#808080",
                ],
                index: 1,
            },
            {
                label: "Option 5",
                palatteLabel: "Option 5",
                isCustom: false,
                colors: [
                    "#D32F2F",
                    "#FBC02D",
                    "#388E3C",
                    "#1976D2",
                    "#7B1FA2",
                    "#F57C00",
                    "#303F9F",
                    "#0288D1",
                ],
            },
            {
                label: "Option 6",
                palatteLabel: "Option 6",
                isCustom: false,
                colors: [
                    "#1E88E5",
                    "#D81B60",
                    "#43A047",
                    "#FB8C00",
                    "#8E24AA",
                    "#E53935",
                    "#00ACC1",
                    "#546E7A",
                ],
            },
            {
                label: "Option 7",
                palatteLabel: "Option 7",
                isCustom: false,
                colors: [
                    "#FF6F61",
                    "#6B4226",
                    "#5F4B8B",
                    "#88B04B",
                    "#F7CAC9",
                    "#92A8D1",
                    "#955251",
                    "#B565A7",
                ],
            },
            {
                label: "Option 8",
                palatteLabel: "Option 8",
                isCustom: false,
                colors: [
                    "#E63946",
                    "#F1FAEE",
                    "#A8DADC",
                    "#457B9D",
                    "#1D3557",
                    "#F4A261",
                    "#2A9D8F",
                    "#264653",
                ],
            },
            {
                label: "Option 9",
                palatteLabel: "Option 9",
                isCustom: false,
                colors: [
                    "#F94144",
                    "#F3722C",
                    "#F8961E",
                    "#F9C74F",
                    "#90BE6D",
                    "#43AA8B",
                    "#577590",
                    "#4D908E",
                ],
            },
        ];
        const [colors, setColors] = useState([]);
        const [showCustomPopover, setShowCustomPopover] =
            useState<HTMLButtonElement | null>(null);
        const [color, setColor] = useState("#000000");
        const [editColor, setEditColor] = useState("");
        const { data, setData } = useBlockSettings<any>(id);
        const [value, setValue] = useState(data.option);
        const [optionValue, setOptionValue] = useState(data.option);
        const [colorPalatteFlag, setColorPalatteFlag] = useState(false);
        const [editColorPalatte, setEditColorPalatte] = useState(-1);
        const [editIndex, setEditIndex] = useState(-1);
        const [paletteEditIndex, setPaletteEditIndex] = useState(-1);
        const [paletteName, setPaletteName] = useState("");
        const pathVal = path;
        const optionPathVal = "option";
        const [colorPalette, setColorPalette] = useState(palettes);
        const [toggleAddEdit, setToggleAddEdit] = useState<"" | "add" | "edit">(
            "",
        );
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        const computedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, pathVal);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, pathVal]).get();
        const optionComputedValue = useMemo(() => {
            return computed(() => {
                if (!data) {
                    return "";
                }
                const v = getValueByPath(data, optionPathVal);
                if (typeof v === "undefined") {
                    return "";
                } else if (typeof v === "string") {
                    return v;
                }
                return JSON.stringify(v, null, 2);
            });
        }, [data, optionPathVal]).get();
        useEffect(() => {
            setValue(computedValue);
        }, [computedValue]);
        useEffect(() => {
            setOptionValue(optionComputedValue);
        }, [optionComputedValue]);
        useEffect(() => {
            const option =
                typeof optionComputedValue === "string"
                    ? JSON.parse(optionComputedValue)
                    : optionComputedValue;
            if (
                option.hasOwnProperty("customSettings") &&
                option["customSettings"].hasOwnProperty("customColorPalette")
            ) {
                const paletteColors = colorPalette.filter(
                    (item) => item.isCustom === false,
                );
                const colorPaletteData = [
                    ...paletteColors,
                    ...option["customSettings"]["customColorPalette"],
                ];
                setColorPalette((prevColourPalatte) => {
                    return [...colorPaletteData];
                });
            }
        }, [id]);
        /**
         * Handles the click event on the "Add new color palette" button.
         * Resets the local state for the color palette and sets the position of the popover.
         * @param event The event object for the click event.
         */
        function handleClick(event: MouseEvent<HTMLButtonElement>) {
            // Reset the local state for the color palette
            setToggleAddEdit("add");
            setColors([]);
        }
        function handleClose() {
            setColorPalatteFlag(false);
            setShowCustomPopover(null);
            setToggleAddEdit("");
        }
        /**
         * Handles the deletion of a color palette.
         * Removes the palette from both the local state and the custom settings.
         */
        function handleDelete() {
            // Parse the value if it's a string
            const option =
                typeof optionValue === "string"
                    ? JSON.parse(optionValue)
                    : optionValue;
            // Remove the palette from the local color palette state
            colorPalette.splice(paletteEditIndex, 1);
            // Access the custom color palette settings
            const customColorPalette =
                option["customSettings"]["customColorPalette"];
            // Find and remove the palette from the custom settings
            const index = customColorPalette.findIndex(
                (item) => item.index === paletteEditIndex + 1,
            );
            customColorPalette.splice(index, 1);
            // Update indices of remaining palettes
            let paletteIndex = paletteEditIndex;
            for (let i = index; i < customColorPalette.length; i++) {
                if (customColorPalette[i].index !== undefined) {
                    customColorPalette[i].index = paletteIndex + 1;
                    paletteIndex++;
                }
            }
            // Update the data and state
            setData(
                optionPathVal,
                option as PathValue<any, typeof optionPathVal>,
            );
            setColorPalette(colorPalette);
            setColorPalatteFlag(false);
            setShowCustomPopover(null);
            setToggleAddEdit("");
        }
        function handleEdit(index) {
            setEditIndex(index);
            setColorPalatteFlag(false);
        }
        function handleColorPicker() {
            setColorPalatteFlag(!colorPalatteFlag);
        }
        /**
         * Handles the change event for the color palette select input.
         * Updates the state with the new color palette data.
         * @param label The label of the selected color palette.
         */
        function handleColorChange(label, color) {
            setPaletteName(label);
            // Find the color palette with the matching label
            const colors =
                label === "" || label === undefined
                    ? colorPalette[0]
                    : colorPalette.find((item) => item.label === label);
            // Update the state with the new color palette data
            if (
                Data.variation == "echart-scatter-plots" ||
                Data.variation == "echart-stack-chart"
            ) {
                runStateUpdate(
                    optionComputedValue,
                    optionPathVal,
                    colors.colors,
                );
            } else {
                runStateUpdateCustom(colors.colors, pathVal);
            }
            onColorPalatteSelected(optionComputedValue, colors.colors);
        }
        /**
         * Handles the click event for the edit palette button.
         * Updates the state with the information of the palette to be edited.
         * @param id The id of the palette to be edited.
         * @param label The label of the palette to be edited.
         * @param colors The colors of the palette to be edited.
         * @param index The index of the palette to be edited.
         */
        function handlePaletteEditButtonClick(id, label, colors, index) {
            // Store the index of the palette to be edited
            setPaletteEditIndex(index);
            // Store the label of the palette to be edited
            setPaletteName(label);
            // Set the toggle to show the edit palette form
            setToggleAddEdit("edit");
            // Store the id of the palette to be edited
            setEditColorPalatte(id);
            // Store the colors of the palette to be edited
            setColors(colors);
        }
        /**
         * Adds a new color row to the list of colors.
         * @param {string} color The color to be added.
         */
        function addColorRow(color) {
            // Check if the color is not already in the list of colors
            if (!colors.includes(color)) {
                // Add the new color to the list of colors
                setColors([...colors, color]);
            }
        }
        /**
         * Edits a color row in the list of colors.
         * @param {string} color The new color to replace the old one.
         * @param {number} index The index of the color row to be edited.
         */
        function editColorRow(color, index) {
            // Replace the old color with the new one in the list of colors
            colors.splice(index, 1, color);
        }
        /**
         * Checks if a color palette with the current name already exists.
         * @returns {boolean} True if a palette with the same name exists, false otherwise.
         */
        function duplicateExists() {
            // Check if the current palette name already exists in the list of available labels
            return availableLabels.includes(paletteName);
        }
        /**
         * Adds a new color palette to the list of custom palettes
         */
        function handleAddPalette() {
            if (
                paletteName === "" ||
                colors.length === 0 ||
                duplicateExists()
            ) {
                // Don't add the palette if the name is empty, the colors array is empty or a duplicate exists
                return;
            }
            // Add the new palette to the list of custom palettes
            setColorPalette((prev) => [
                ...prev,
                {
                    label: paletteName,
                    colors: colors,
                    palatteLabel: paletteName,
                    isCustom: true,
                },
            ]);
            // Get the current value of the block's `option` property
            let option =
                typeof optionValue === "string"
                    ? JSON.parse(optionValue)
                    : optionValue;
            // Create a new object with the current values of the `option` property
            // and add a `customSettings` property with an empty object
            if (option.hasOwnProperty("customSettings")) {
                option = {
                    ...option,
                    customSettings: {
                        ...option["customSettings"],
                    },
                };
            } else {
                option = {
                    ...option,
                    customSettings: {},
                };
            }
            // Add the new palette to the `customColorPalette` property of the `customSettings` object
            if (option["customSettings"].hasOwnProperty("customColorPalette")) {
                option = {
                    ...option,
                    customSettings: {
                        customColorPalette: [
                            ...option["customSettings"]["customColorPalette"],
                            {
                                label: paletteName,
                                colors: colors,
                                palatteLabel: paletteName,
                                isCustom: true,
                                index: colorPalette.length + 1,
                            },
                        ],
                    },
                };
            } else {
                option = {
                    ...option,
                    customSettings: {
                        customColorPalette: [
                            {
                                label: paletteName,
                                colors: colors,
                                palatteLabel: paletteName,
                                isCustom: true,
                                index: colorPalette.length + 1,
                            },
                        ],
                    },
                };
            }
            // Update the block's `option` property with the new value
            setData(
                optionPathVal,
                option as PathValue<any, typeof optionPathVal>,
            );
            // Reset the state of the color palette editor
            setColors([]);
            setPaletteName("");
            handleClose();
            setToggleAddEdit("");
        }
        /**
         * Edits an existing color palette in the list of custom palettes
         */
        function handleEditPalette() {
            if (paletteEditIndex >= 0) {
                // Replace the existing palette with the new one
                colorPalette.splice(paletteEditIndex, 1, {
                    label: paletteName,
                    colors: colors,
                    palatteLabel: paletteName,
                    isCustom: true,
                    index: paletteEditIndex,
                });
                let option =
                    typeof optionValue === "string"
                        ? JSON.parse(optionValue)
                        : optionValue;
                if (option.hasOwnProperty("customSettings")) {
                    // Update the `customColorPalette` property of the `customSettings` object
                    option = {
                        ...option,
                        customSettings: {
                            ...option["customSettings"],
                        },
                    };
                    if (
                        option["customSettings"].hasOwnProperty(
                            "customColorPalette",
                        )
                    ) {
                        const customColorPalette =
                            option["customSettings"]["customColorPalette"];
                        const index = customColorPalette.find(
                            (item) => item.index === paletteEditIndex + 1,
                        );
                        if (index) {
                            // Replace the existing palette with the new one in the `customColorPalette` array
                            customColorPalette.splice(index, 1, {
                                label: paletteName,
                                colors: colors,
                                palatteLabel: paletteName,
                                isCustom: true,
                                index: paletteEditIndex + 1,
                            });
                        }
                    } else {
                        // Add the new palette to the `customColorPalette` property of the `customSettings` object
                        option = {
                            ...option,
                            customSettings: {
                                customColorPalette: [
                                    {
                                        label: paletteName,
                                        colors: colors,
                                        palatteLabel: paletteName,
                                        isCustom: true,
                                        index: paletteEditIndex,
                                    },
                                ],
                            },
                        };
                    }
                }
                // Update the block's `option` property with the new value
                setData(
                    optionPathVal,
                    option as PathValue<any, typeof optionPathVal>,
                );
            }
            // Reset the state of the color palette editor
            setColors([]);
            setPaletteName("");
            handleClose();
            setToggleAddEdit("");
        }
        /**
         * Updates the state with the provided option after a debounce period.
         * Clears any existing timeout before setting a new one.
         *
         * @param option - The new option to set in state.
         * @param path - The path where the option should be set (default is 'option').
         */
        function runStateUpdateCustom(option, path = "option") {
            // Clear existing timeout if present
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            // Set a new timeout to update state with a delay
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, option as PathValue<any, typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        function runStateUpdate(option, path, colors) {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            const options = JSON.parse(option);
            options.color = colors;

            // Set a new timeout to update state with a delay
            timeoutRef.current = setTimeout(() => {
                try {
                    setData(path, options as PathValue<any, typeof path>);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        }
        const availableLabels = useMemo(() => {
            return colorPalette.map((item) => item.label);
        }, [colorPalette]);
        const popOverContent = (
            <>
                {/* StyledOverlay section for showing header of popup*/}
                <StyledOverlay>
                    <StyledModel>
                        <StyledHeader>
                            <IconButton
                                sx={{
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                    color: "rgba(0, 0, 0, .5)",
                                }}
                                onClick={(e) => {
                                    setToggleAddEdit("");
                                    setShowCustomPopover(null);
                                    handleClose();
                                }}
                            >
                                <ArrowBack />
                            </IconButton>
                            <StyledTitle>
                                &nbsp;
                                {toggleAddEdit === "add" ? "Create" : "Edit"} a
                                Custom Color Palette
                            </StyledTitle>
                        </StyledHeader>
                    </StyledModel>
                </StyledOverlay>
                {/*popup name section */}
                <StyledRowSection>
                    <Typography variant="body2" color="secondary">
                        Name
                    </Typography>
                    <StyledTextField
                        defaultValue={
                            toggleAddEdit === "edit" ? paletteName : ""
                        }
                        onChange={(e) => {
                            setPaletteName(e.target.value);
                        }}
                        placeholder="Enter Palette Name"
                    ></StyledTextField>
                </StyledRowSection>
                {/* colours section */}
                {toggleAddEdit !== "edit" && (
                    <StyledRowSection>
                        <Typography variant="body2" color="secondary">
                            Colours
                        </Typography>
                        <StyledOutlinedInput
                            id="outlined-adornment-colours"
                            placeholder="Enter Hex code or Pick Color"
                            aria-label="Select Colour"
                            type={"text"}
                            endAdornment={
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label={"select colour"}
                                        edge="end"
                                    >
                                        <StyledFormatColorFill
                                            onClick={handleColorPicker}
                                        ></StyledFormatColorFill>
                                    </IconButton>
                                </InputAdornment>
                            }
                            label="Select Colour"
                        />
                    </StyledRowSection>
                )}
                {/* show color palette when color palate button is pressed */}
                {colorPalatteFlag && (
                    <StyledPaletteContainer>
                        <StyledPicker
                            onChange={(newColor) => {
                                setColor(newColor.hex);
                            }}
                            color={color}
                        ></StyledPicker>
                        <hr></hr>
                        <StyledButtonContainer>
                            <StyledButtonClose
                                onClick={() => {
                                    setColorPalatteFlag(false);
                                }}
                            >
                                <Icon
                                    sx={{
                                        width: "20px",
                                        height: "20px",
                                        mt: "6px",
                                        marginRight: "12px",
                                        fontSize: "12px",
                                        fontWeight: "bold",
                                        color: "rgba(0, 0, 0, .5)",
                                    }}
                                >
                                    <Close />
                                </Icon>
                            </StyledButtonClose>
                            <StyledCheck
                                onClick={() => {
                                    addColorRow(color);
                                }}
                            >
                                <Icon
                                    sx={{
                                        width: "20px",
                                        height: "20px",
                                        mt: "6px",
                                        marginRight: "12px",
                                        fontSize: "20px",
                                        fontWeight: "bold",
                                        color: "rgba(0, 81, 255, 0.5)",
                                    }}
                                >
                                    <Check />
                                </Icon>
                            </StyledCheck>
                        </StyledButtonContainer>
                    </StyledPaletteContainer>
                )}
                {/* selected colours section */}
                <StyledEmptyContainer>
                    {(
                        colors ||
                        colorPalette[editColorPalatte]?.colors ||
                        []
                    ).map((color, index) => (
                        <StyledEmptyContainer key={index}>
                            <StyledSelectedColorContainer>
                                <StyledSelectedColorRow
                                    style={{
                                        backgroundColor: color,
                                    }}
                                ></StyledSelectedColorRow>
                                <StyledColorSpan>{color}</StyledColorSpan>
                                {/* Edit button for the colour selected */}
                                <StyledRowColorEditButton
                                    aria-label={"select colour"}
                                    edge="end"
                                >
                                    <StyledEditIcon
                                        onClick={() => {
                                            handleEdit(index);
                                            setEditColor(color);
                                        }}
                                    ></StyledEditIcon>
                                </StyledRowColorEditButton>
                                {/* delete button for the colour selected */}
                                <IconButton
                                    aria-label={"select colour"}
                                    edge="end"
                                >
                                    <StyledDeleteIcon
                                        onClick={() => {
                                            setColors(
                                                colors.filter(
                                                    (item) => item !== color,
                                                ),
                                            );
                                        }}
                                    ></StyledDeleteIcon>
                                </IconButton>
                            </StyledSelectedColorContainer>
                            {index === editIndex && (
                                // Edit color palette when edit button is clicked
                                <StyledPaletteContainer>
                                    <StyledPicker
                                        onChange={(newColor) => {
                                            setEditColor(newColor.hex);
                                        }}
                                        color={editColor}
                                    ></StyledPicker>
                                    <hr></hr>
                                    <StyledButtonContainer
                                        style={{
                                            marginTop: "5px",
                                            marginBottom: "10px",
                                        }}
                                    >
                                        {/* close the color picker without selecting color */}
                                        <StyledButtonClose
                                            onClick={() => {
                                                setColorPalatteFlag(false);
                                                setEditIndex(-1);
                                            }}
                                        >
                                            <Icon
                                                sx={{
                                                    width: "20px",
                                                    height: "20px",
                                                    mt: "6px",
                                                    marginRight: "12px",
                                                    fontSize: "12px",
                                                    fontWeight: "bold",
                                                    color: "rgba(0, 0, 0, .5)",
                                                }}
                                            >
                                                <Close />
                                            </Icon>
                                        </StyledButtonClose>
                                        {/* select the color from colour picker */}
                                        <StyledCheck
                                            onClick={() => {
                                                editColorRow(editColor, index);
                                                setEditIndex(-1);
                                            }}
                                        >
                                            <Icon
                                                sx={{
                                                    width: "20px",
                                                    height: "20px",
                                                    mt: "6px",
                                                    marginRight: "12px",
                                                    fontSize: "20px",
                                                    fontWeight: "bold",
                                                    color: "rgba(0, 81, 255, 0.5)",
                                                }}
                                            >
                                                <Check />
                                            </Icon>
                                        </StyledCheck>
                                    </StyledButtonContainer>
                                </StyledPaletteContainer>
                            )}
                        </StyledEmptyContainer>
                    ))}
                </StyledEmptyContainer>
                <StyledButtonContainer
                // style={{ marginTop: "10px", marginBottom: "20px" }}
                >
                    {toggleAddEdit === "edit" && (
                        <>
                            <StyledButtonClose onClick={handleDelete}>
                                Delete
                            </StyledButtonClose>
                            <StyledButtonAdd onClick={handleEditPalette}>
                                Save
                            </StyledButtonAdd>
                        </>
                    )}
                    {toggleAddEdit !== "edit" && (
                        <>
                            <StyledButtonClose
                                size="small"
                                onClick={handleClose}
                            >
                                Close
                            </StyledButtonClose>
                            <StyledButtonAdd
                                size="small"
                                onClick={handleAddPalette}
                            >
                                Add
                            </StyledButtonAdd>
                        </>
                    )}
                </StyledButtonContainer>
            </>
        );
        return (
            <StyledEmptyContainer>
                {toggleAddEdit != "" && (
                    <StyledContainerToggle>
                        <>{popOverContent}</>
                    </StyledContainerToggle>
                )}
                {toggleAddEdit === "" && (
                    <StyledCustomPaletteAdd>
                        <StyledButton
                            onClick={handleClick}
                            variant="outlined"
                            color="primary"
                            size="small"
                        >
                            + Add Custom Color Palette
                        </StyledButton>
                    </StyledCustomPaletteAdd>
                )}
                <hr></hr>
                <StyledCustomPaletteEdit>
                    {colorPalette.map((palette, index) => (
                        <ColorPalette
                            onClick={handleColorChange}
                            onPaletteEditClick={() =>
                                handlePaletteEditButtonClick(
                                    index,
                                    palette.label,
                                    palette.colors,
                                    index,
                                )
                            }
                            colors={palette.colors}
                            isCustom={palette.isCustom}
                            label={palette.label}
                        />
                    ))}
                </StyledCustomPaletteEdit>
            </StyledEmptyContainer>
        );
    },
);
