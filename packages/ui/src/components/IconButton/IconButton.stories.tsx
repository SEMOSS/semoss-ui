import type { Meta, StoryObj } from "@storybook/react";
import { MoreVert } from "@mui/icons-material";
import { IconButton } from "./";

const meta: Meta<typeof IconButton> = {
    title: "Components/IconButton",
    component: IconButton,
    args: {
        color: "secondary",
        disabled: false,
    },
    argTypes: {
        color: {
            options: [
                "inherit",
                "action",
                "disabled",
                "secondary",
                "primary",
                "error",
                "info",
                "success",
                "warning",
            ],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof IconButton>;

export const Enabled: Story = {
    render: (args) => (
        <IconButton {...args}>
            <MoreVert />
        </IconButton>
    ),
};

export const EdgeEnd: Story = {
    render: () => (
        <IconButton edge="end">
            <MoreVert />
        </IconButton>
    ),
};
