import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checklist } from ".";

const meta: Meta<typeof Checklist> = {
    title: "Components/Checklist",
    component: Checklist,
    args: {
        options: ["Option 1", "Option 2", "Option 3"],
        onChange: (selected) => console.log(selected),
        sx: { width: "100%" },
        checked: ["1"],
    },
    argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Checklist>;

export const Default: Story = {
    render: (args) => <Checklist {...args} />,
};
