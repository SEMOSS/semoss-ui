import { useMemo } from "react";
import { TextField, TextFieldProps } from "../TextField";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { IconButton, InputAdornment } from "@mui/material";

export type SearchFieldProps = TextFieldProps & {
    /**
     * Enable clearable functionality
     */
    onClear?: Function;
};

export const Search = (props: SearchFieldProps) => {
    const hasSearch = useMemo(() => {
        const searchValue: string = (props?.value as string) ?? "";
        return searchValue.length > 0;
    }, [props?.value]);

    return (
        <TextField
            variant="outlined"
            placeholder="Search"
            {...props}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
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
