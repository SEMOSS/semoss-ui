import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./index";

const meta: Meta<typeof Slider> = {
    title: "Components/Slider",
    component: Slider,
    args: {
        step: 5,
        defaultValue: 70,
        size: "medium",
        min: 0,
        max: 100,
        marks: false,
    },
    argTypes: {
        size: {
            options: ["small", "medium"],
            control: { type: "radio" },
        },
        marks: {
            options: [true, false],
            control: { type: "radio" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Slider>;

export const Default: Story = {
    render: (args) => <Slider aria-label="Volume" {...args} />,
};
