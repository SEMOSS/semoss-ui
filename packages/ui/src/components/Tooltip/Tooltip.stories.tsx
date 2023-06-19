import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "../Tooltip/index";
import Button from "@mui/material/Button";

const meta: Meta<typeof Tooltip> = {
    title: "Components/Tooltip",
    component: Tooltip,
    args: {
        placement: "top-start",
    },
    argTypes: {
        placement: {
            options: [
                "top",
                "top-end",
                "top-start",
                "left-start",
                "left",
                "left-end",
                "right-start",
                "right",
                "right-end",
                "bottom-start",
                "bottom",
                "bottom-end",
            ],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
    render: (args) => (
        <Tooltip {...args} title="Add">
            <Button>Hover over me</Button>
        </Tooltip>
    ),
};
