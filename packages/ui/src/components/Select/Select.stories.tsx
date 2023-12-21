import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select, Stack, Box } from "../../";

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
                <Select.Item value={1}>1</Select.Item>
                <Select.Item value={2}>2</Select.Item>
                <Select.Item value={3}>3</Select.Item>
                <Select.Item value={4}>4</Select.Item>
                <Select.Item value={5}>5</Select.Item>
            </Select>
            <Box>Value: {selected}</Box>
        </Stack>
    );
};

const SelectMultipleComponent = () => {
    const [formState, setFormState] = React.useState({
        userRoles: [],
    });

    const handleFieldChange = (event) => {
        setFormState((formState) => ({
            ...formState,
            [event.target.name]: event.target.value,
        }));
    };

    return (
        <Stack spacing={2}>
            <Select
                sx={{ width: "100%" }}
                name="userRoles"
                id="userRoles"
                variant="outlined"
                label="userRoles"
                SelectProps={{
                    multiple: true,
                    value: formState.userRoles,
                    onChange: handleFieldChange,
                }}
            >
                <Select.Item value="admin">Admin</Select.Item>
                <Select.Item value="user1">User1</Select.Item>
                <Select.Item value="user2">User2</Select.Item>
            </Select>
            <Box>Value: {formState.userRoles.map((val) => `${val} `)}</Box>
        </Stack>
    );
};

export const Multiple: Story = {
    render: () => <SelectMultipleComponent />,
};

export const Default: Story = {
    render: (args) => <SelectComponent {...args} />,
};

export const Loading: Story = {
    render: () => (
        <Select fullWidth label="Loading Select" loading>
            <Select.Item value={1}>1</Select.Item>
            <Select.Item value={2}>2</Select.Item>
            <Select.Item value={3}>3</Select.Item>
            <Select.Item value={4}>4</Select.Item>
            <Select.Item value={5}>5</Select.Item>
        </Select>
    ),
};
