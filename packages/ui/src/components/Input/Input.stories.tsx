import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input, InputLabel } from "./index";

const meta: Meta<typeof Input> = {
    title: "Components/Input",
    component: Input,
    subcomponents: {
        Label: InputLabel,
    },
};

export default meta;
type Story = StoryObj<typeof Input>;

const InputExample = () => {
    const [value, setValue] = useState("");

    return (
        <>
            <InputLabel>Text Input: </InputLabel>
            <Input
                value={value}
                onChange={(e) => {
                    setValue(e.target.value);
                }}
                sx={{ borderRadius: 2 }}
            />
        </>
    );
};

export const Variant: Story = {
    render: () => <InputExample></InputExample>,
};
