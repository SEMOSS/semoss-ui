import { TextField, TextFieldProps } from "../TextField/index";
import Icons from "../Icons/index";
import { InputAdornment } from "../InputAdornment";

export const Searchbar = (props: TextFieldProps) => {
    return (
        <TextField
            focused={false}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <Icons.SearchOutlined />
                    </InputAdornment>
                ),
            }}
            {...props}
        >
            {props.children}
        </TextField>
    );
};
