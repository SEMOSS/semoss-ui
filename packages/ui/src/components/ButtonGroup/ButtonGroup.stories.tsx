import React from "react";
import { ButtonGroup } from "./ButtonGroup";

import { Button } from "../Button";

export default {
    title: "Components/ButtonGroup",
    component: ButtonGroup,
};

const Template = (args) => {
    return (
        <ButtonGroup {...args}>
            <Button>Button 1</Button>
            <Button>Button 2</Button>
        </ButtonGroup>
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
};
