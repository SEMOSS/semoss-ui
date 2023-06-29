import React, { useState, useRef } from "react";
import { TextField, TextFieldProps } from "../TextField/index";
import Icons from "../Icons/index";
import { Button } from "../Button";

export type SearchFieldProps = TextFieldProps & {
    /**
     * If max items is exceeded, the number of items to show after the ellipsis.
     * @default false
     */
    enableEndAdornment?: boolean;
};

export const Search = (props: SearchFieldProps) => {
    const { enableEndAdornment } = props;
    let textInput = useRef(null);

    return (
        <TextField
            focused={false}
            variant={"outlined"}
            inputRef={textInput}
            InputProps={{
                startAdornment: <Icons.SearchOutlined />,
                endAdornment: (
                    <>
                        {enableEndAdornment && (
                            <Button
                                onClick={() => (textInput.current.value = "")}
                            >
                                <Icons.CloseOutlined
                                    sx={{ color: "#5c5c5c" }}
                                />
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
