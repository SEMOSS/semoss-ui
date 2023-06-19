import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "./index";

const meta: Meta<typeof Input> = {
    title: "Components/Input/Input.Label",
    component: Input.Label,
};

export default meta;
type Story = StoryObj<typeof Input>;

const InputExample = () => {
    return <Input.Label>Label: *</Input.Label>;
};

export const Variant: Story = {
    render: () => <InputExample />,
};
