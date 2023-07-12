import React from "react";
import { Radio } from "./";

export default {
    title: "Components/RadioGroup/Item",
    component: Radio,
};

const Template = (args) => {
    return (
        <>
            <Radio value="1" {...args} />
            <Radio value="2" {...args} />
        </>
    );
};

export const Default = Template.bind({});

Default.args = {};
