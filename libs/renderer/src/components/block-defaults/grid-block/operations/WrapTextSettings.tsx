import { observer } from "mobx-react-lite";
import { useBlockSettings } from "../../../../hooks";
import {
    CellBackgroundSettings,
    ChartTitleSettings,
    GridBlockDef,
    WrapTextSettings,
} from "../GridBlock";
import { GridBlockColumn } from "../grid-block.types";
import { Button, styled, Switch, TextField, Typography } from "@semoss/ui";
import { ColorPickerSettingsNew } from "../../../block-settings/shared/ColorPickerSettingsNew";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

import { Paths, PathValue } from "@/types";
import { Block, BlockDef } from "../../../../store";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import Checkbox from "@mui/material/Checkbox";
import { Autocomplete } from "@mui/material";
import { set } from "mobx";

export interface TitleStylingProps<D extends BlockDef = GridBlockDef> {
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

export const ColumnTextWrap = observer(
    <D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);
        const [wrapTextSettings, setWrapTextSettings] =
            useState<WrapTextSettings>({
                selectedColumn: [] as string[],
                textWrap: false,
            });

        useEffect(() => {
            if (data.option?.wrapTextSettings) {
                setWrapTextSettings(data.option.wrapTextSettings);
            }
        }, [data.option]);

        const resetToInitialState = () => {
            const defaultState = {
                selectedColumn: [] as string[],
                textWrap: false,
            };
            setWrapTextSettings(defaultState);
            const newOption = {
                ...data.option,
                wrapTextSettings: defaultState,
            };
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const handleColumnChange = (_, selected: GridBlockColumn[]) => {
            const newSelected = selected.map((col) => col.name);
            const newOption = {
                ...data.option,
                wrapTextSettings: {
                    ...wrapTextSettings,
                    selectedColumn: newSelected,
                },
            };
            setWrapTextSettings((prev) => ({
                ...prev,
                selectedColumns: newSelected,
            }));
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const handleInputChange = (checked: boolean) => {
            const newOption = {
                ...data.option,
                wrapTextSettings: {
                    ...wrapTextSettings,
                    textWrap: checked,
                },
            };
            setWrapTextSettings((prev) => ({
                ...prev,
                textWrap: checked,
            }));
            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

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
                            wrapTextSettings.selectedColumn.includes(c.name),
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
                {/* <StyledFieldWrapper> */}
                <StyledAxisDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                >
                    <Switch
                        size="small"
                        checked={wrapTextSettings.textWrap}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e.target.checked)
                        }
                        title="Show Title"
                    />
                    <Typography variant="body2" color="secondary">
                        Show Title
                    </Typography>
                </StyledAxisDiv>
                {/* </StyledFieldWrapper> */}
            </StyledContainer>
        );
    },
);
