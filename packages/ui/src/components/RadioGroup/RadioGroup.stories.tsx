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
                <RadioGroup.Radio value="First Example" label="First" />
                <RadioGroup.Radio value="Second Example" label="Second" />
            </RadioGroup>

            <RadioGroup label="Radio Row" row>
                <RadioGroup.Radio value="First Example" label="First" />
                <RadioGroup.Radio value="Second Example" label="Second" />
            </RadioGroup>

            <RadioGroup
                label="Radio Row / Default Value = Top"
                row
                defaultValue="Top"
            >
                <RadioGroup.Radio
                    value="Top"
                    label="Top"
                    labelPlacement="top"
                />
                <RadioGroup.Radio
                    value="Start"
                    label="Start"
                    labelPlacement="start"
                />
                <RadioGroup.Radio
                    value="Bottom"
                    label="Bottom"
                    labelPlacement="bottom"
                />
                <RadioGroup.Radio value="End" label="End" />
            </RadioGroup>
        </>
    ),
};
