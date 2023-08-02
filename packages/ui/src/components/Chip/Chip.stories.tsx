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
        variantColor: "green",
    },
    argTypes: {
        variant: {
            options: ["outlined", "filled"],
            control: { type: "radio" },
        },
        variantColor: {
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
            <Chip label="Chip" {...args} variantColor="default" />
            <Chip label="Chip" variantColor="indigo" variant="outlined" />
            <Chip label="Chip" variantColor="indigo" variant="filled" />
            <Chip label="Chip" variantColor="turqoise" variant="filled" />
            <Chip label="Chip" variantColor="turqoise" variant="outlined" />
            <Chip label="Chip" variantColor="green" variant="filled" />
            <Chip label="Chip" variantColor="green" variant="outlined" />
            <Chip label="Chip" variantColor="purple" variant="filled" />
            <Chip label="Chip" variantColor="lcpurple" variant="outlined" />
            <Chip label="Chip" variantColor="primary" variant="outlined" />
            <Chip label="Chip" variantColor="primary" variant="filled" />
            <Chip label="Chip" variantColor="pink" variant="filled" />
            <Chip label="Chip" variantColor="pink" variant="outlined" />
            <Chip label="Chip" variantColor="lcpink" variant="outlined" />
            <Chip label="Chip" variantColor="lcpink" variant="filled" />
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
