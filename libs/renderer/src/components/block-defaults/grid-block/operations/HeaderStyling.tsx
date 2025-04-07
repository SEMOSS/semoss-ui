import { observer } from "mobx-react-lite";
import {
    useBlock,
    useBlockSettings,
    useBlocksPixel,
    useFrame,
    useFrameHeaders,
} from "../../../../hooks";
import { GridBlockDef, HeaderBackgroundSettings } from "../GridBlock";
import { GridBlockColumn } from "../grid-block.types";
import {
    // Autocomplete,
    Button,
    styled,
    TextField,
    Typography,
    // Checkbox,
} from "@semoss/ui";
import { ColorPickerSettingsNew } from "../../../block-settings/shared/ColorPickerSettingsNew";
import { useEffect, useMemo, useState } from "react";
import { computed, when } from "mobx";
import { getValueByPath } from "@/utility";
import { Paths, PathValue } from "@/types";
import { Block, BlockDef } from "../../../../store";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import Checkbox from "@mui/material/Checkbox";
import { Autocomplete } from "@mui/material";

export interface HeaderStylingProps<D extends BlockDef = GridBlockDef> {
    id: string;
    path: Paths<Block<D>["data"], 4>;
}

const StyledContainer = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing(1),
}));

const StyledFieldWrapper = styled("div")(() => ({
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    gap: "8px",
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
    width: "100%",
}));

const StyledAxisDiv = styled("div")<{
    display?: string;
    justifyContent?: string;
    gap?: string;
}>(({ theme, display, justifyContent, gap }) => ({
    display: display ?? undefined,
    justifyContent: justifyContent ?? undefined,
    flexDirection: "row",
    padding: "8px 0",
    alignItems: "center",
    gap: gap ?? undefined,
}));

export const HeaderStyling = observer(
    // ({ id,path }: HeaderStylingProps<D>) => {
    <D extends BlockDef = GridBlockDef>({
        id,
        path,
    }: HeaderStylingProps<D>) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);
        const [value, setValue] = useState("");
        const [showValueLabel, setShowValueLabel] = useState(true);

        const [gridStyle, setGridStyle] = useState<HeaderBackgroundSettings>({
            backgroundColor: "#ffffff",
            fontSize: "16",
            fontColor: "#000000",
            selectedColumn: [] as string[],
        });

        useEffect(() => {
            // const headerSettings = data.option?.headerBackgroundSettings;
            // if (headerSettings) {
            //     setGridStyle({
            //         backgroundColor: headerSettings.backgroundColor,
            //         selectedColumn: headerSettings.columns,
            //     });
            // }

            if (data.option?.headerBackgroundSettings) {
                setGridStyle(data.option.headerBackgroundSettings);
            }
        }, [data.option]);

        const handleColumnChange = (_, selected: GridBlockColumn[]) => {
            const newSelected = selected.map((col) => col.name);
            const newOption = {
                ...data.option,
                headerBackgroundSettings: {
                    // backgroundColor: gridStyle.backgroundColor,
                    // columns: newSelected,
                    ...gridStyle,
                    selectedColumn: newSelected,
                },
            };
            setGridStyle((prev) => ({
                ...prev,
                selectedColumns: newSelected,
            }));
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const handleColorChange = (newColor: string) => {
            const newOption = {
                ...data.option,
                headerBackgroundSettings: {
                    // backgroundColor: newColor,
                    // columns: gridStyle.selectedColumn,
                    ...gridStyle,
                    backgroundColor: newColor,
                },
            };
            setGridStyle((prev) => ({
                ...prev,
                backgroundColor: newColor,
            }));
            // setData(path, newOption as PathValue<D["data"], typeof path>);
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const handleFontColorChange = (newColor: string) => {
            const newOption = {
                ...data.option,
                headerBackgroundSettings: {
                    ...gridStyle,
                    fontColor: newColor,
                },
            };
            setGridStyle((prev) => ({
                ...prev,
                fontColor: newColor,
            }));
            // setData(path, newOption as PathValue<D["data"], typeof path>);
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const handleFontSizeChange = (
            e: React.ChangeEvent<HTMLInputElement>,
        ) => {
            const newFontSize = e.target.value;
            const newOption = {
                ...data.option,
                headerBackgroundSettings: {
                    ...gridStyle,
                    fontSize: newFontSize,
                },
            };
            setGridStyle((prev) => ({
                ...prev,
                fontSize: newFontSize,
            }));
            // setData(path, newOption as PathValue<D["data"], typeof path>);
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const resetToInitialState = () => {
            const defaultState = {
                backgroundColor: "#ffffff",
                fontSize: "16",
                fontColor: "#000000",
                selectedColumn: [] as string[],
            };
            setGridStyle(defaultState);
            const newOption = {
                ...data.option,
                headerBackgroundSettings: defaultState,
            };
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        // const computedValue = useMemo(() => {
        //     return computed(() => {
        //         if (!data) {
        //             return "";
        //         }
        //         const v = getValueByPath(data, path);
        //         if (typeof v === "undefined") {
        //             return "";
        //         } else if (typeof v === "string") {
        //             return v;
        //         }
        //         return JSON.stringify(v, null, 2);
        //     });
        // }, [data, path]).get();

        // useEffect(() => {
        //     setValue(computedValue);
        // }, [computedValue, data]);

        // useEffect(() => {
        //     if (data.hasOwnProperty("option")) {
        //         reInitializeFeatures(data.option);
        //     }
        // }, [id]);

        // useEffect(() => {
        //     if (data.hasOwnProperty("option")) {
        //         retainLocalState(data.option);
        //     }
        // }, [showValueLabel]);

        //Retain the local state of the feature on toggle switch and on reset button
        //With the local state we will be displaying the values in the fields
        // const retainLocalState = (options) => {
        //     setGridStyle((prev) => ({
        //         ...prev,
        //         backgroundColor: options?.backgroundColor || "white",
        //     }));
        // };

        // const reInitializeFeatures = (options) => {
        //     // setShowTitle(options["title"].show ?? true);
        // };

        const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
        const checkedIcon = <CheckBoxIcon fontSize="small" />;
        const renderOption = (
            props: any,
            option: GridBlockColumn,
            { selected }: any,
        ) => {
            return (
                <li {...props}>
                    <Checkbox
                        icon={icon}
                        checkedIcon={checkedIcon}
                        style={{ marginRight: 8 }}
                        checked={selected}
                    />
                    {option.name}
                </li>
            );
        };

        return (
            <StyledContainer>
                <StyledFieldWrapper>
                    <label>
                        <Typography variant="body2" color="secondary">
                            Select Column
                        </Typography>{" "}
                    </label>
                    <Autocomplete
                        fullWidth
                        multiple
                        disableCloseOnSelect
                        size="small"
                        value={data.columns?.filter((c) =>
                            gridStyle.selectedColumn.includes(c.name),
                        )}
                        onChange={handleColumnChange}
                        options={data.columns || []}
                        getOptionLabel={(option) => option.name}
                        renderOption={renderOption}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                size="small"
                                placeholder="Select column"
                            />
                        )}
                    />
                </StyledFieldWrapper>
                <StyledFieldWrapper>
                    <label>
                        <Typography variant="body2" color="secondary">
                            Header Font Size
                        </Typography>{" "}
                    </label>
                    <StyledTextField
                        id="length"
                        size="small"
                        name="length"
                        value={gridStyle?.fontSize}
                        onChange={handleFontSizeChange}
                        // onChange={
                        //     (e) =>
                        //     handleInputChange("labelLength", e.target.value)
                        // }
                    />
                </StyledFieldWrapper>

                <StyledFieldWrapper>
                    <label>
                        <Typography variant="body2" color="secondary">
                            Header Font Color
                        </Typography>{" "}
                    </label>
                    <ColorPickerSettingsNew
                        id={id}
                        path="option.headerBackgroundSettings.fontColor"
                        colorValue={gridStyle.fontColor}
                        onChange={handleFontColorChange}
                        // colorValue={valueLabel.fontColor}
                        // onChange={(e) => handleInputChange("color", e)}
                    />
                </StyledFieldWrapper>

                <StyledFieldWrapper>
                    <label>
                        <Typography variant="body2" color="secondary">
                            Header Background Color
                        </Typography>{" "}
                    </label>
                    <ColorPickerSettingsNew
                        id={id}
                        path="option.headerBackgroundSettings.backgroundColor"
                        colorValue={gridStyle.backgroundColor}
                        onChange={handleColorChange}
                        // onChange={(e) =>
                        //     handleInputChange("backgroundColor", e)
                        // }
                    />
                </StyledFieldWrapper>

                <StyledAxisDiv display="flex" justifyContent="end">
                    <Button
                        size="small"
                        color="primary"
                        variant="contained"
                        onClick={resetToInitialState}
                    >
                        Reset
                    </Button>
                </StyledAxisDiv>
            </StyledContainer>
        );
    },
);
