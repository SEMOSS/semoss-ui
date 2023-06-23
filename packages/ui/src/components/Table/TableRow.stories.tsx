import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "../Table/index";

const meta: Meta<typeof Table> = {
    title: "Components/Table/Table.Row",
    component: Table,
    subcomponents: {
        Row: Table.Row,
    },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => <Table.Row>Table Row Content</Table.Row>,
};
