import React, { useState } from "react";
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
    const [value, setValue] = useState<null | string>("");
    return (
        <TextField
            focused={false}
            variant={"outlined"}
            defaultValue={value}
            onChange={(e) => setValue(e.target.value)}
            InputProps={{
                startAdornment: <Icons.SearchOutlined />,
                endAdornment: (
                    <>
                        {enableEndAdornment && (
                            <Button
                                onClick={(e) => {
                                    setValue(null);
                                }}
                            >
                                <Icons.CloseOutlined />
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
