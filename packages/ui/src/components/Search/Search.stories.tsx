import React from "react";
import { Search } from "./";

export default {
    title: "Components/Search",
    component: Search,
    args: {
        placeholder: "Search Placeholder here",
        disabled: false,
        enableEndAdornment: false,
    },
};

const Template = (args) => {
    return <Search {...args} />;
};

export const Default = Template.bind({});
