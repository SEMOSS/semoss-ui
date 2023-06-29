import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PhoneNumberPicker } from "../PhoneNumberPicker/index";
import React from "react";

const meta: Meta<typeof PhoneNumberPicker> = {
    title: "Components/PhoneNumberPicker",
    component: PhoneNumberPicker,
};

export default meta;

type Story = StoryObj<typeof PhoneNumberPicker>;

const Example = () => {
    const [number, setNumber] = useState("");

    return (
        <>
            <PhoneNumberPicker
                defaultCountry={"us"}
                onChange={(val) => setNumber(val)}
            />
            <div>Selected phone number: {number}</div>
        </>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
