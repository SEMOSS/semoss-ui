import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup, Radio } from "../RadioGroup/index";
import { FormControl, FormLabel, FormControlLabel } from "../FormControl/index";

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
            <FormControl>
                <FormLabel>Example</FormLabel>
                <RadioGroup {...args}>
                    <FormControlLabel
                        value="First Example"
                        control={<Radio />}
                        label="First"
                    />
                    <FormControlLabel
                        value="Second Example"
                        control={<Radio />}
                        label="Second"
                    />
                </RadioGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Row Example</FormLabel>
                <RadioGroup row>
                    <FormControlLabel
                        value="First Example"
                        control={<Radio />}
                        label="First"
                    />
                    <FormControlLabel
                        value="Second Example"
                        control={<Radio />}
                        label="Second"
                    />
                </RadioGroup>
            </FormControl>

            <FormControl>
                <FormLabel>Label Placement</FormLabel>
                <RadioGroup row defaultValue="Top">
                    <FormControlLabel
                        value="Top"
                        control={<Radio />}
                        label="Top"
                        labelPlacement="top"
                    />
                    <FormControlLabel
                        value="Start"
                        control={<Radio />}
                        label="Start"
                        labelPlacement="start"
                    />
                    <FormControlLabel
                        value="Bottom"
                        control={<Radio />}
                        label="Bottom"
                        labelPlacement="bottom"
                    />
                    <FormControlLabel
                        value="End"
                        control={<Radio />}
                        label="End"
                    />
                </RadioGroup>
            </FormControl>
        </>
    ),
};
