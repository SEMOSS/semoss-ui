import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { DatePicker } from "./index";
import { Box } from "../Box/index";

const meta: Meta<typeof DatePicker> = {
    title: "Components/DatePicker",
    component: DatePicker,
};

export default meta;

type Story = StoryObj<typeof DatePicker>;

const Example = () => {
    const [val, setVal] = useState<string | null>("2023-06-13T07:00:00.000Z");
    return (
        <Box>
            <DatePicker
                label="Basic DatePicker"
                value={val}
                onChange={(e) => setVal(e)}
            />
            <Box sx={{ mt: 2 }}>Selected date: {val}</Box>
        </Box>
    );
};

export const Default: Story = {
    render: () => <Example />,
};
