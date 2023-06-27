import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "../IconButton/index";
import MoreVertIcon from "@mui/icons-material/MoreVert";

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
            <MoreVertIcon />
        </IconButton>
    ),
};

export const EdgeEnd: Story = {
    render: () => (
        <IconButton edge="end">
            <MoreVertIcon />
        </IconButton>
    ),
};
