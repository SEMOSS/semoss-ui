import { ComponentProps, useState, useEffect } from "react";
import { Story } from "@storybook/react";
import { FileDropzone } from "./FileDropzone";
import React from "react";

export default {
    title: "Components/FileDropzone",
    component: FileDropzone,
    argTypes: {},
};

/* Stories */
const Template: Story<ComponentProps<typeof FileDropzone>> = (args) => {
    const { value, onChange, ...otherArgs } = args;
    const [selectedValues, setSelectedValues] = useState(value);

    useEffect(() => {
        setSelectedValues(value);
    }, [value]);

    return (
        <FileDropzone
            value={selectedValues}
            onChange={(newValues) => {
                setSelectedValues(newValues);
            }}
            {...otherArgs}
        />
    );
};

// Default
export const Default = Template.bind({});

Default.args = {
    onChange: () => null,
    value: null,
};

export const Disabled = Template.bind({});

Disabled.args = {
    ...Default.args,
    disabled: true,
};

export const Multiple = Template.bind({});

Multiple.args = {
    ...Default.args,
    multiple: true,
    value: [],
};
