import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "./index";
import { Stack } from "../Stack";
import { Box } from "../Box";

const meta: Meta<typeof Select> = {
    title: "Components/Select",
    component: Select,
    args: {
        variant: "outlined",
        size: "medium",
        color: "primary",
        disabled: false,
        error: false,
    },
    argTypes: {
        variant: {
            options: ["filled", "standard", "outlined"],
            control: { type: "select" },
        },
        size: {
            options: ["small", "medium"],
            control: { type: "radio" },
        },
        disabled: {
            options: [true, false],
            control: { type: "radio" },
        },
        error: {
            options: [true, false],
            control: { type: "radio" },
        },
        color: {
            options: [
                "primary",
                "secondary",
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

type Story = StoryObj<typeof Select>;

const SelectComponent = (args) => {
    const [selected, setSelected] = useState("");

    const onChange = (event) => {
        setSelected(event.target.value as string);
    };

    return (
        <Stack spacing={2}>
            <Select
                {...args}
                sx={{ width: "100%" }}
                onChange={onChange}
                value={selected}
                helperText="Select helper text"
                placeholder="Select placeholder"
                label="Select Label"
            >
                <Select.Option value={1}>1</Select.Option>
                <Select.Option value={2}>2</Select.Option>
                <Select.Option value={3}>3</Select.Option>
                <Select.Option value={4}>4</Select.Option>
                <Select.Option value={5}>5</Select.Option>
            </Select>
            <Box>Value: {selected}</Box>
        </Stack>
    );
};

export const Default: Story = {
    render: (args) => <SelectComponent {...args} />,
};
