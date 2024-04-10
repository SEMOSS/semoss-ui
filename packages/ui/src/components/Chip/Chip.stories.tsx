import type { Meta, StoryObj } from "@storybook/react";
import { Chip } from "../Chip/index";

const onClick = () => {
    return true;
};
const meta: Meta<typeof Chip> = {
    title: "Components/Chip",
    component: Chip,
    args: {
        variant: "outlined",
        clickable: true,
        disabled: false,
        color: "default",
    },
    argTypes: {
        variant: {
            options: ["outlined", "filled"],
            control: { type: "radio" },
        },
        color: {
            options: [
                "default",
                "primary",
                "green",
                "pink",
                "purple",
                "indigo",
                "turqoise",
                "lcpink",
                "lcpurple",
                "lcindigo",
                "lcprimary",
            ],
            control: { type: "select" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Chip>;

export const Outlined: Story = {
    render: (args) => (
        <>
            <Chip label="Chip" {...args} />
        </>
    ),
};

export const Delete: Story = {
    render: () => (
        <Chip
            label="Chip"
            variant="outlined"
            clickable={true}
            onDelete={onClick}
        />
    ),
};
