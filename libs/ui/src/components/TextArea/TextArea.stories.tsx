import React from "react";
import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TextArea } from "./index";

const meta: Meta<typeof TextArea> = {
    title: "Components/TextArea",
    component: TextArea,
};

export default meta;
type Story = StoryObj<typeof TextArea>;

const Example = () => {
    const [value, setValue] = useState("");

    return (
        <>
            <TextArea
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                }}
                id="outlined-textarea"
                label="Multiline Placeholder"
                placeholder="minRows = 2; maxRows = 4"
                minRows={2}
                maxRows={6}
            />
        </>
    );
};

export const Variant: Story = {
    render: () => <Example />,
};
