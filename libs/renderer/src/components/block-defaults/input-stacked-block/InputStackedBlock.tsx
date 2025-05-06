import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import { LinearProgress, TextField, styled, InputLabel, Typography, InputAdornment } from "@mui/material";
import { CircularProgress, Stack } from "@semoss/ui";

import { useBlock } from "../../../hooks";
import { BlockComponent, BlockDef } from "../../../store";
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
const StyledTypography = styled(Typography)(({})=>({
    color: '#666666',
    fontFamily: "Inter",
    fontSize: "14px",
    paddingLeft:"4px",
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "143%", /* 20.02px */
    letterSpacing: "0.17px",
}));
const StyledHelperText = styled(Typography)(({})=>({
    ".MuiFormHelperText-root":{
        marginLeft:"0px",
    },
    color: '#666666',
    fontFamily: "Inter",
    fontSize: "14px",
    fontStyle: "normal",
    fontWeight: "400",
    lineHeight: "143%", /* 20.02px */
    letterSpacing: "0.17px",
    marginLeft:"0px",
}));
const StyledStack = styled(Stack)(({})=>({
    "&.MuiStack-root > .MuiFormLabel-root":{
        paddingLeft:"2px",
    },
    "&.MuiStack-root > .MuiFormControl-root > .MuiFormHelperText-root":{
            marginLeft:"0px",
            marginTop:"8px",
            paddingLeft:"2px",
        },
    "&.MuiStack-root > .MuiFormControl-root > .MuiFormHelperText-root > .MuiTypography-root ":{
            marginLeft:"0px",
    }
}));
export interface InputStackedBlockDef extends BlockDef<"input-stacked"> {
    widget: "input-stacked";
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

export const InputStackedBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, setData, listeners } = useBlock<InputStackedBlockDef>(id);

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const debouncedCallback = debounced(() => {
        listeners.onChange();
    }, 200);

    return (
                <StyledStack {...attrs}>
                    <InputLabel
                        shrink={false}
                        htmlFor={`textfield-${id}`}
                    >
                        <StyledTypography variant='body2'>{data.label ?? 'Label'}</StyledTypography>
                    </InputLabel>
                    <StyledTextField
                        size="small"
                        value={
                            data.value !== null && data.value !== undefined
                                ? data.value
                                : ""
                        }
                        rows={data.rows}
                        multiline={data.rows > 1 && data.type === "text"}
                        required={Boolean(data.required)}
                        disabled={Boolean(data?.disabled || data?.loading)}
                        helperText={
                            <StyledHelperText variant='body2' sx={{marginLeft:"4px"}}>{data?.hint ?? ''}</StyledHelperText>
                        }
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
                    />
                </StyledStack>
    );
});
