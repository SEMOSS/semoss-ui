import React from "react";
import { MoreVert } from "@mui/icons-material";
import { TextField } from "../..";
import { InputAdornment } from ".";

export default {
    title: "Components/InputAdornment",
    component: InputAdornment,
};

const Template = (args) => {
    return (
        <TextField
            {...args}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <MoreVert />
                    </InputAdornment>
                ),
            }}
        />
    );
};

export const Default = Template.bind({});

Default.args = {};
