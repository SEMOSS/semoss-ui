import React from "react";
import { InputAdornment } from "./InputAdornment";
import { Input } from "../Input";
import { Icon } from "../Icon";
import { Icons } from "../Icons";
import MoreVertIcon from "@mui/icons-material/MoreVert";

export default {
    title: "Components/Input/InputAdornment",
    component: InputAdornment,
    // argTypes: {
    //     spacing: {
    //         options: ["small", "medium"],
    //         control: { type: "radio" },
    //     },
    //     variant: {
    //         options: ["circular", "rounded"],
    //         control: { type: "select" },
    //     },
    // },
};

const Template = (args) => {
    return (
        <Input
            variant={"outlined"}
            label={"Outlined"}
            startAdornment={
                <InputAdornment position="start">
                    <Icon>
                        <MoreVertIcon />
                    </Icon>
                </InputAdornment>
            }
        />
    );
};

export const Default = Template.bind({});

Default.args = {};
