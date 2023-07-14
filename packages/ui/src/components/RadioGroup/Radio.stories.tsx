import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Radio } from "./";

const meta: Meta<typeof Radio> = {
    title: "Components/RadioGroup/Item",
    component: Radio,
    args: {
        checked: false,
        disabled: false,
        label: "Radio Label",
        radioProps: {
            size: "small",
        },
    },
    argTypes: {
        label: {
            options: ["Radio", "Label"],
        },
        checked: {
            options: [true, false],
        },
        radioProps: {
            size: {
                options: ["medium", "small"],
            },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Radio>;

export const Default: Story = {
    render: (args) => <Radio {...args} />,
};
