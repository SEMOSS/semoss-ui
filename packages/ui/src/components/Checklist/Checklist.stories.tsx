import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checklist, CheckedState, Option } from "./";

const meta: Meta<typeof Checklist> = {
    title: "Components/Checklist",
    component: Checklist,
    args: {},
    argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Checklist>;

const Example = (args: (typeof meta)["args"]) => {
    const initialOptions = [
        { id: 1, label: "Option 1" },
        { id: 2, label: "Option 2" },
        { id: 3, label: "Option 3" },
    ];
    const initialChecked = [1, 3];

    const [checked, setChecked] = useState<Option<number>[]>([]);

    // Update the state when the options prop changes
    useEffect(() => {
        // Reset the checked state when options change
        setChecked(initialChecked);
    }, [initialChecked.length]);

    // Handle the onChange event
    const handleChecklistChange = (updatedCheckedOptions) => {
        setChecked(updatedCheckedOptions);
        // Add your custom logic here
    };
    console.log("here");

    return (
        <>
            <Checklist
                options={initialOptions}
                checked={checked}
                onChange={handleChecklistChange}
                getKey={(option) => option.id}
            />
        </>
    );
};

export const Default: Story = {
    render: (args) => <Example {...args} />,
};
