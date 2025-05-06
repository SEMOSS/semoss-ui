import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";
import { LinearProgress, TextField, styled, InputAdornment } from "@mui/material";
import { CircularProgress } from "@semoss/ui";
import { debounced } from "../../../utility";

const StyledTextField = styled(TextField)({
    "& .MuiFormLabel-root.MuiInputLabel-root": {
        top: "auto",
        left: "auto",
    },
});

const StyledLoading = styled(CircularProgress)(({ theme }) => ({
    color: theme.palette.divider,
}));
export interface InputStackedButtonBlockDef extends BlockDef<"input-stacked-button"> {
    widget: "input-stacked-button";
    data: {
        style: CSSProperties;
        label: string;
        value: string | number;
        type: string;
        rows: number;
        multiline: boolean;
        required: boolean;
        disabled: boolean;
        hint?: string;
        loading?: boolean;
        show: string;
    };
    listeners: {
        preProcess: true;
        onChange: true;
    };
}

export const InputStackedButtonBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<InputStackedButtonBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const debouncedCallback = debounced(() => {
        listeners.onChange();
    }, 200);

    return (
        <StyledTextField
            size="small"
            value={
                data.value !== null && data.value !== undefined
                    ? data.value
                    : ""
            }
            label={
                typeof data.label !== "string"
                    ? JSON.stringify(data.label)
                    : data.label
            }
            rows={data.rows}
            multiline={data.rows > 1 && data.type === "text"}
            required={Boolean(data.required)}
            disabled={Boolean(data?.disabled || data?.loading)}
            helperText={data?.hint}
            style={{
                ...data.style,
            }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="end">
                        {data?.loading ? <StyledLoading size={20} /> : <></>}
                    </InputAdornment>
                ),
            }}
            type={data.type}
            onChange={(e) => {
                const value = e.target.value;
                // update the value
                setData("value", value);
                debouncedCallback();
            }}
            {...attrs}
        />
    );
});
