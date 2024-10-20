import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    args: {
        children: "Button",
        variant: "contained",
        color: "primary",
        disabled: false,
    },
    argTypes: {
        variant: {
            options: ["text", "outlined", "contained"],
        },
        color: {
            options: [
                "inherit",
                "secondary",
                "primary",
                "error",
                "info",
                "success",
                "warning",
            ],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Variant: Story = {
    render: (args) => <Button {...args} />,
};
