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
        color: "green",
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
            <Chip label="Chip" color="indigo" variant="outlined" />
            <Chip label="Chip" color="indigo" variant="filled" />
            <Chip label="Chip" color="turqoise" variant="filled" />
            <Chip label="Chip" color="turqoise" variant="outlined" />
            <Chip label="Chip" color="green" variant="filled" />
            <Chip label="Chip" color="green" variant="outlined" />
            <Chip label="Chip" color="purple" variant="filled" />
            <Chip label="Chip" color="lcpurple" variant="outlined" />
            <Chip label="Chip" color="primary" variant="outlined" />
            <Chip label="Chip" color="primary" variant="filled" />
            <Chip label="Chip" color="pink" variant="filled" />
            <Chip label="Chip" color="pink" variant="outlined" />
            <Chip label="Chip" color="lcpink" variant="outlined" />
            <Chip label="Chip" color="lcpink" variant="filled" />
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
