import React from "react";
import { Searchbar } from "./";

export default {
    title: "Components/Searchbar",
    component: Searchbar,
    args: {
        placeholder: "Search Placeholder here",
        disabled: false,
    },
};

const Template = (args) => {
    return <Searchbar {...args} />;
};

export const Default = Template.bind({});
