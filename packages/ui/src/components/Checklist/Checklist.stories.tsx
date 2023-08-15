import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checklist } from "./";

const meta: Meta<typeof Checklist> = {
    title: "Components/Checklist",
    component: Checklist,
    args: {},
    argTypes: {},
};

export default meta;

type Story = StoryObj<typeof Checklist>;

export const Default: Story = {
    render: (args) => <Checklist {...args} />,
};
