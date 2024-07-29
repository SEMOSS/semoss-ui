import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "./index";
import { Mail } from "@mui/icons-material";

const meta: Meta<typeof Badge> = {
    title: "Components/Badge",
    component: Badge,
    args: {
        badgeContent: 4,
        color: "success",
    },
    argTypes: {
        color: {
            options: [
                "secondary",
                "primary",
                "error",
                "info",
                "success",
                "warning",
                "default",
            ],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
    render: (args) => (
        <Badge {...args}>
            <Mail color="action" />
        </Badge>
    ),
};
