import type { Meta, StoryObj } from "@storybook/react";
import { Pagination } from "../Pagination/index";

const meta: Meta<typeof Pagination> = {
    title: "Components/Pagination",
    component: Pagination,
    args: {
        color: "secondary",
        variant: "text",
        disabled: false,
        showFirstButton: false,
        showLastButton: false,
        count: 10,
        shape: "rounded",
    },
    argTypes: {
        color: {
            options: ["standard", "secondary", "primary"],
            control: { type: "select" },
        },
        variant: {
            options: ["outlined", "text"],
            control: { type: "radio" },
        },
        shape: {
            options: ["round", "rounded"],
            control: { type: "radio" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof Pagination>;

export const Default: Story = {
    render: (args) => <Pagination {...args} />,
};
