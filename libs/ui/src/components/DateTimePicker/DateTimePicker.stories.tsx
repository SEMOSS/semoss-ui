import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { DateTimePicker } from "./index";
import { Box } from "../Box/index";

const meta: Meta<typeof DateTimePicker> = {
    title: "Components/DateTimePicker",
    component: DateTimePicker,
};

export default meta;

type Story = StoryObj<typeof DateTimePicker>;

const Example = () => {
    const [val, setVal] = useState<string | null>("2023-06-13T07:00:00.000Z");
    return (
        <Box>
            <DateTimePicker
                label="Basic DateTimePicker"
                value={val}
                onChange={(e) => setVal(e)}
            />
            <Box sx={{ mt: 2 }}>Selected date and time: {val}</Box>
        </Box>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
