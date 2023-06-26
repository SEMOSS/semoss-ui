import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Accordion } from "./index";

const meta: Meta<typeof Accordion> = {
    title: "Components/Accordion",
    component: Accordion,
    args: {
        square: false,
        elevation: 1,
        disabled: false,
        disableGutters: false,
        expanded: false,
        defaultExpanded: false,
    },
};
export default meta;
type Story = StoryObj<typeof Accordion>;

const AccordionExample = (args) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Accordion
            {...args}
            expanded={expanded}
            onChange={() => setExpanded(!expanded)}
            variant="outlined"
        >
            <Accordion.Trigger>Summary 1</Accordion.Trigger>
            <Accordion.Content>Details 1</Accordion.Content>
        </Accordion>
    );
};

export const Multiple: Story = {
    render: (args) => <AccordionExample {...args} />,
};
