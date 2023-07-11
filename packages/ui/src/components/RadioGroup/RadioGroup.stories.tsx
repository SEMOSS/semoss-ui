import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "../RadioGroup/index";

const meta: Meta<typeof RadioGroup> = {
    title: "Components/RadioGroup",
    component: RadioGroup,
    args: {
        row: false,
    },
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
    render: (args) => (
        <>
            <RadioGroup {...args} label="Example">
                <RadioGroup.Item value="First Example" label="First" />
                <RadioGroup.Item value="Second Example" label="Second" />
            </RadioGroup>

            <RadioGroup label="Radio Row" row>
                <RadioGroup.Item value="First Example" label="First" />
                <RadioGroup.Item value="Second Example" label="Second" />
            </RadioGroup>

            <RadioGroup
                label="Radio Row / Default Value = Top"
                row
                defaultValue="Top"
            >
                <RadioGroup.Item value="Top" label="Top" labelPlacement="top" />
                <RadioGroup.Item
                    value="Start"
                    label="Start"
                    labelPlacement="start"
                />
                <RadioGroup.Item
                    value="Bottom"
                    label="Bottom"
                    labelPlacement="bottom"
                />
                <RadioGroup.Item value="End" label="End" />
            </RadioGroup>
        </>
    ),
};
