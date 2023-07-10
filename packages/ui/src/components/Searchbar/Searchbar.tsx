import React, { useRef } from "react";
import { TextField, TextFieldProps } from "../TextField";
import Icons from "../Icons";
import { Button } from "../Button";

export type SearchbarFieldProps = TextFieldProps & {
    /**
     * If max items is exceeded, the number of items to show after the ellipsis.
     * @default false
     */
    enableEndAdornment?: boolean;
};

export const Searchbar = (props: SearchbarFieldProps) => {
    const { enableEndAdornment } = props;
    const textInput = useRef(null);

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
