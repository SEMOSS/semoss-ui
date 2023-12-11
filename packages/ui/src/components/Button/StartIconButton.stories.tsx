import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./index";
import DeleteIcon from "@mui/icons-material/Delete";

const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    args: {
        children: "Delete",
        variant: "contained",
        color: "primary",
        disabled: false,
        size: "medium",
        loading: false,
        startIcon: <DeleteIcon />,
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

export const StartIcon: Story = {
    render: (args) => <Button {...args} />,
};
