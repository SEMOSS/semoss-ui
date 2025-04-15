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

export const RowSpanning = observer(
    <D extends BlockDef = GridBlockDef>({ id, path }: TitleStylingProps<D>) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);
        const [rowSpanning, setRowSpanning] = useState(false);
        const [wrapTextSettings, setWrapTextSettings] =
            useState<WrapTextSettings>({
                selectedColumn: [] as string[],
                textWrap: false,
            });

        useEffect(() => {
            if (data.option?.rowSpanning !== rowSpanning) {
                setRowSpanning(data.option.rowSpanning);
            }
        }, [data.option]);

        const handleInputChange = (checked: boolean) => {
            const newOption = {
                ...data.option,
                rowSpanning: checked,
            };
            setRowSpanning(checked);

            setData(
                "option",
                newOption as PathValue<GridBlockDef["data"], "option">,
            );
        };

        const icon = <CheckBoxOutlineBlankIcon fontSize="small" />;
        const checkedIcon = <CheckBoxIcon fontSize="small" />;

        return (
            <StyledContainer>
                {/* <StyledFieldWrapper> */}
                <StyledAxisDiv
                    display="flex"
                    gap="8px"
                    style={{ marginTop: "8px" }}
                >
                    <Switch
                        size="small"
                        checked={rowSpanning}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            handleInputChange(e.target.checked)
                        }
                        title="Show Row Spanning"
                    />
                    <Typography variant="body2" color="secondary">
                        Show Row Spanning
                    </Typography>
                </StyledAxisDiv>
                {/* </StyledFieldWrapper> */}
            </StyledContainer>
        );
    },
);
