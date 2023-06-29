import React from "react";
import { InputAdornment } from "./InputAdornment";
import { Icon } from "../Icon";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { TextField } from "../TextField";

export default {
    title: "Components/InputAdornment",
    component: InputAdornment,
};

const Template = (args) => {
    return (
        <TextField
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <MoreVertIcon />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export const Default = Template.bind({});

Default.args = {};
