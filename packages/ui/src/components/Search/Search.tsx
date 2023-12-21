import { useMemo, useRef, useState } from "react";
// import { Button } from "../Button";
import { TextFieldProps } from "../TextField";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment, TextField } from "@mui/material";

export type SearchFieldProps = TextFieldProps & {
    /**
     * @default false
     */
    clearable?: boolean;

    /**
     * Pass state function directly to avoid ref issues
     */
    onClear?: Function;
};

export const Search = (props: SearchFieldProps) => {
    const clearable = props?.clearable ?? false;
    const textInput = useRef(null);

    const [focused, setFocused] = useState<boolean>(false);

    const hasSearch = useMemo(() => {
        const searchValue: string = (props?.value as string) ?? "";
        return searchValue.length > 0;
    }, [props?.value]);

    return (
        <TextField
            variant="outlined"
            inputRef={textInput}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchOutlined />
                    </InputAdornment>
                ),
                endAdornment: (
                    <>
                        {clearable && (
                            <IconButton
                                onClick={async () => {
                                    setFocused(false);
                                    props?.onClear
                                        ? await props.onClear()
                                        : null;
                                }}
                                disabled={!hasSearch}
                            >
                                <CloseOutlined
                                    sx={{
                                        color: hasSearch
                                            ? "#5c5c5c"
                                            : "disabled",
                                    }}
                                />
                            </IconButton>
                        )}
                    </>
                ),
                onFocus: () => setFocused(true),
                onBlur: () => setFocused(false),
            }}
            InputLabelProps={{
                shrink: focused || hasSearch,
                style: {
                    marginLeft: focused || hasSearch ? "0px" : "30px",
                    transition: "all 0.2s ease-out",
                },
            }}
            {...props}
        >
            {props.children}
        </TextField>
    );
};
