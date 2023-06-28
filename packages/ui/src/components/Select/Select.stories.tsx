import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../Select";
import { Checkbox } from "../Checkbox";
import { Input } from "../Input";
import { MenuItem } from "../Menu";
import { Stack } from "../Stack";

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
            <div sx={{}}>
                <div sx={{ width: "70%" }}>Hey</div>
                <div sx={{ width: "10%" }}>
                    <Select
                        {...args}
                        sx={{ width: "100%" }}
                        onChange={onChange}
                        value={selected}
                        helperText="Select helper text"
                        placeholder="Select placeholder"
                        label="Select Label"
                    >
                        <Select.Item value={1}>1</Select.Item>
                        <Select.Item value={2}>2</Select.Item>
                        <Select.Item value={3}>3</Select.Item>
                        <Select.Item value={4}>4</Select.Item>
                        <Select.Item value={5}>5</Select.Item>
                    </Select>
                </div>

                <div sx={{ width: "20%" }}>Hello</div>
            </div>
            <Box>Value: {selected}</Box>
        </Stack>
    );
};

export const Default: Story = {
    render: (args) => <SelectComponent {...args} />,
};
