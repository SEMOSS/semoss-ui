import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "./index";

const meta: Meta<typeof Table> = {
    title: "Components/Table/Table.Cell",
    component: Table,
    subcomponents: {
        Cell: Table.Cell,
    },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => <Table.Cell>Table Cell Content</Table.Cell>,
};
