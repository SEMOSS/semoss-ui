import React, { useState } from "react";
import { Search } from ".";

export default {
    title: "Components/Search",
    component: Search,
    args: {
        disabled: false,
        placeholder: "Search",
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
            onClear={() => {
                setValue("");
            }}
        />
    );
};

export const Default = Template.bind({});
