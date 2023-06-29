import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "../Table/index";

const meta: Meta<typeof Table> = {
    title: "Components/Table/Table.Container",
    component: Table,
    subcomponents: {
        Container: Table.Container,
    },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => <Table.Container>Table Container Content</Table.Container>,
};
