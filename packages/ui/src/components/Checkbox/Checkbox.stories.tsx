import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "../../";

const meta: Meta<typeof Checkbox> = {
    title: "Components/Checkbox",
    component: Checkbox,
    args: {
        defaultChecked: true,
        checked: false,
        disabled: false,
        label: "Checkbox Label",
        size: "medium",
    },
    argTypes: {
        label: {
            options: ["Checkbox", "Label"],
        },
        checked: {
            options: [true, false],
        },
        size: {
            options: ["medium", "small"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
    render: (args) => <Checkbox {...args} />,
};
