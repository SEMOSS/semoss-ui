import { useMemo, useState } from "react";
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
    const [focused, setFocused] = useState<boolean>(false);

    const hasSearch = useMemo(() => {
        const searchValue: string = (props?.value as string) ?? "";
        return searchValue.length > 0;
    }, [props?.value]);

    return (
        <TextField
            variant="outlined"
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
