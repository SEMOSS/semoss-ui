import React, { useRef } from "react";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { Button, TextField, TextFieldProps } from "../../";

export type SearchFieldProps = TextFieldProps & {
    /**
     * If max items is exceeded, the number of items to show after the ellipsis.
     * @default false
     */
    enableEndAdornment?: boolean;
};

export const Search = (props: SearchFieldProps) => {
    const { enableEndAdornment } = props;
    const textInput = useRef(null);

    return (
        <TextField
            focused={false}
            variant={"outlined"}
            inputRef={textInput}
            InputProps={{
                startAdornment: <SearchOutlined />,
                endAdornment: (
                    <>
                        {enableEndAdornment && (
                            <Button
                                onClick={() => (textInput.current.value = "")}
                            >
                                <CloseOutlined sx={{ color: "#5c5c5c" }} />
                            </Button>
                        )}
                    </>
                ),
            }}
            {...props}
        >
            {props.children}
        </TextField>
    );
};
