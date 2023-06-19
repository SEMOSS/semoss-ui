import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "../Badge/index";
import MailIcon from "@mui/icons-material/Mail";

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
            <MailIcon color="action" />
        </Badge>
    ),
};
