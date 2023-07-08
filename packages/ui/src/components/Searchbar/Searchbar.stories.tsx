import React from "react";
import { Searchbar } from "./";

export default {
    title: "Components/Searchbar",
    component: Searchbar,
    args: {
        placeholder: "Placeholder here",
        disabled: false,
        enableEndAdornment: false,
    },
};

const Template = (args) => {
    return <Searchbar {...args} />;
};

export const Default = Template.bind({});
