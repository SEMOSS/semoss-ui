import { useRef, useMemo } from "react";
// import { Button } from "../Button";
import { TextFieldProps } from "../TextField";
import { CloseOutlined, SearchOutlined } from "@mui/icons-material";
import { Button, TextField } from "../../";

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

    const refValue = !textInput
        ? ""
        : !textInput.current
        ? ""
        : textInput.current.value;

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
            InputLabelProps={{
                shrink: refValue.length > 0,
                style: {
                    marginLeft: refValue.length > 0 ? "0px" : "30px",
                    transition: "all 0.1s ease-out",
                },
            }}
            {...props}
        >
            {props.children}
        </TextField>
    );
};
