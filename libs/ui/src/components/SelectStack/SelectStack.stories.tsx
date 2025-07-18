import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { SelectStack, Stack, Box, Typography } from "../..";

const meta: Meta<typeof SelectStack> = {
    title: "Components/SelectStack",
    component: SelectStack,
    args: {
        variant: "outlined",
        size: "medium",
        color: "primary",
        disabled: false,
        error: false,
        label: "Label",
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
        label: {
            control: { type: "text" },
        },
    },
};

export default meta;

type Story = StoryObj<typeof SelectStack>;

const SelectStackComponent = (args) => {
    const [selected, setSelected] = useState("");
    const [componentId, setComponentId] = useState("");
    console.log(args, "args");
    useEffect(() => {
        if (!componentId) {
            // gets rid of suggestions
            setComponentId(`generated-id-${Date.now()}`);
        }
    }, [componentId]);

    const onChange = (event) => {
        setSelected(event.target.value as string);
    };

    return (
        <Stack spacing={2}>
            <div style={{}}>
                <SelectStack
                    {...args}
                    sx={{ width: "100%" }}
                    onChange={onChange}
                    value={selected}
                    helperText="Select helper text"
                    placeholder="Select placeholder"
                    label={args.label ?? "Label"}
                >
                    <SelectStack.Item value={1}>1</SelectStack.Item>
                    <SelectStack.Item value={2}>2</SelectStack.Item>
                    <SelectStack.Item value={3}>3</SelectStack.Item>
                    <SelectStack.Item value={4}>4</SelectStack.Item>
                    <SelectStack.Item value={5}>5</SelectStack.Item>
                </SelectStack>

                <div style={{ width: "20%" }}>Hello</div>
            </div>
            <Box>Value: {selected}</Box>
        </Stack>
    );
};

const SelectStackMultipleComponent = () => {
    const [formState, setFormState] = React.useState({
        userRoles: [],
    });

    const handleFieldChange = (event) => {
        console.log(event);
        setFormState((formState) => ({
            ...formState,
            [event.target.name]: event.target.value,
        }));
    };

    console.log(formState);
    return (
        <Stack spacing={2}>
            <SelectStack
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
                <SelectStack.Item value="admin">Admin</SelectStack.Item>
                <SelectStack.Item value="user1">User1</SelectStack.Item>
                <SelectStack.Item value="user2">User2</SelectStack.Item>
            </SelectStack>
            <Box>Value: {formState.userRoles.map((val) => `${val} `)}</Box>
        </Stack>
    );
};

export const Multiple: Story = {
    render: () => <SelectStackMultipleComponent />,
};

export const Default: Story = {
    render: (args) => <SelectStackComponent {...args} />,
};
