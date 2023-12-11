import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    args: {
        children: "View Templates",
        variant: "contained",
        color: "primary",
        size: "medium",
        endIcon: <ArrowForwardIcon />,
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
        size: {
            options: ["small", "medium", "large"],
        },
    },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const EndIcon: Story = {
    render: (args) => <Button {...args} />,
};
