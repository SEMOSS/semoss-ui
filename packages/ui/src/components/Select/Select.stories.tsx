import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "../Select/index";
import { Checkbox } from "../Checkbox/index";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";

const meta: Meta<typeof Select> = {
    title: "Components/Select",
    component: Select,
    args: {
        variant: "standard",
    },
    argTypes: {
        variant: {
            options: ["filled", "standard", "outlined"],
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
            >
                <MenuItem value={1}>1</MenuItem>
                <MenuItem value={2}>2</MenuItem>
            </Select>
        </Stack>
    );
};

const SelectMultiple = () => {
    const [selected, setSelected] = useState([]);

    const selectValues = [1, 2, 3, 4, 5];

    const handleChange = (event) => {
        const {
            target: { value },
        } = event;
        setSelected(
            // On autofill we get a stringified value.
            typeof value === "string" ? value.split(",") : value,
        );
    };

    return (
        <>
            <Select
                sx={{ width: "100%" }}
                onChange={handleChange}
                value={selected}
                renderValue={(selected: any) => selected.join(", ")}
                multiple
            >
                {selectValues.map((val) => (
                    <MenuItem key={val} value={val}>
                        <Checkbox checked={selected.indexOf(val) > -1} />
                        {val}
                    </MenuItem>
                ))}
            </Select>
        </>
    );
};

export const Default: Story = {
    render: (args) => <SelectComponent {...args} />,
};

export const MultipleSelect: Story = {
    render: () => <SelectMultiple />,
};
