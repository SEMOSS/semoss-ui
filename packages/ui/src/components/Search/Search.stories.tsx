import React, { useState } from "react";
import { Search } from "./";

export default {
    title: "Components/Search",
    component: Search,
    args: {
        placeholder: "Search Placeholder here",
        disabled: false,
        enableEndAdornment: false,
        label: "Label",
    },
};

const Template = (args) => {
    const [value, setValue] = useState<string>("");
    return (
        <Search
            {...args}
            value={value}
            onChange={(e) => {
                setValue(e.target.value);
            }}
        />
    );
};

export const Default = Template.bind({});
