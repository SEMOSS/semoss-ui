import { useMemo, useRef } from "react";
import { TextField, TextFieldProps } from "../TextField";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";

export type SearchFieldProps = TextFieldProps & {
    /**
     * Enable clearable functionality
     */
    onClear?: () => void;
};

export const Search = (props: SearchFieldProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const hasSearch = useMemo(() => {
        const searchValue: string = (props?.value as string) ?? "";
        return searchValue.length > 0;
    }, [props?.value]);

    return (
        <TextField
            variant="outlined"
            placeholder="Search"
            {...props}
            inputRef={inputRef}
            InputProps={{
                startAdornment: (
                    <InputAdornment
                        position="start"
                        onClick={() => inputRef.current?.focus()}
                        style={{ cursor: "pointer" }}
                    >
                        <SearchOutlined />
                    </InputAdornment>
                ),
                endAdornment: (
                    <>
                        {props?.onClear && (
                            <IconButton
                                onClick={() => {
                                    props?.onClear ? props.onClear() : null;
                                }}
                                sx={{
                                    visibility: hasSearch
                                        ? "visible"
                                        : "hidden",
                                }}
                            >
                                <CloseOutlined
                                    sx={{
                                        color: "#5c5c5c",
                                    }}
                                />
                            </IconButton>
                        )}
                    </>
                ),
            }}
        >
            {props.children}
        </TextField>
    );
};
