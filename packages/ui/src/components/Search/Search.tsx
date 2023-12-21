import { useRef, useState } from "react";
// import { Button } from "../Button";
import { TextFieldProps } from "../TextField";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { TextField } from "../../";
import { IconButton, InputAdornment } from "@mui/material";

export type SearchFieldProps = TextFieldProps & {
    /**
     * If max items is exceeded, the number of items to show after the ellipsis.
     * @default false
     */
    enableEndAdornment?: boolean;
};

export const Search = (props: SearchFieldProps) => {
    const enableEndAdornment = props?.enableEndAdornment ?? false;
    const textInput = useRef(null);

    const [focused, setFocused] = useState<boolean>(false);

    const hasSearch = !textInput
        ? false
        : !textInput.current
        ? false
        : textInput.current.value.length > 0;

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
                        {enableEndAdornment && (
                            <IconButton
                                onClick={(e) => {
                                    textInput.current.value = "";
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
