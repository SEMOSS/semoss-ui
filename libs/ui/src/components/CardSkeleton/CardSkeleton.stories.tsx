import React from "react";

import { Stack } from "../..";
import { CardSkeleton } from "./CardSkeleton";

export default {
    title: "Components/CardSkeleton",
    component: CardSkeleton,
    args: {},
    argTypes: {},
};

const Template = (args) => {
    return (
        <Stack spacing={2}>
            <CardSkeleton />
        </Stack>
    );
};

export const Default = Template.bind({});
