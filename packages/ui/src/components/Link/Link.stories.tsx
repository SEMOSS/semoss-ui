import type { Meta, StoryObj } from "@storybook/react";
import { Link } from "../Link/index";
import React from "react";

const meta: Meta<typeof Link> = {
    title: "Components/Link",
    component: Link,
    args: {
        color: "secondary",
        underline: "always",
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
        underline: {
            options: ["always", "none", "hover"],
        },
    },
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Default: Story = {
    render: (args) => (
        <Link href="#" {...args}>
            Link 1
        </Link>
    ),
};
