import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./index";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const meta: Meta<typeof Icon> = {
    title: "Components/Icon",
    component: Icon,
    args: {
        color: "inherit",
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

type Story = StoryObj<typeof Icon>;

export const Primary: Story = {
    render: (args) => (
        <Icon {...args}>
            <MoreVertIcon />
        </Icon>
    ),
};
