import React, { ComponentProps, useState, useEffect } from "react";
import { Story } from "@storybook/react";
import { FileDropzone } from "./FileDropzone";

export default {
    title: "Components/FileDropzone",
    component: FileDropzone,
    argTypes: {},
    args: {
        id: "default-file-dropzone",
        extensions: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        description: "Drag and Drop ONE File",
        multiple: false,
        disabled: false,
        valid: false,
    },
};

/* Stories */
const Template: Story<ComponentProps<typeof FileDropzone>> = (args) => {
    const { value, onChange, ...otherArgs } = args;
    const [selectedValues, setSelectedValues] = useState(value);

    useEffect(() => {
        setSelectedValues(value);
    }, [value]);

    // useEffect(() => {

    // }, [])

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

//* Default
export const Default = Template.bind({});

Default.args = {
    onChange: () => null,
};

//* Disabled
export const Disabled = Template.bind({});

Disabled.args = {
    ...Default.args,
    id: "disabled-file-dropzone",
    disabled: true,
    description: "Processing File Upload...",
};

//* Mulitple
export const Multiple = Template.bind({});

Multiple.args = {
    ...Default.args,
    id: "multiple-file-dropzone",
    multiple: true,
    description: "Drag and Drop MULTIPLE File(s)",
};
