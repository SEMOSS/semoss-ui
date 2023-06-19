import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "../Table/index";

const meta: Meta<typeof Table> = {
    title: "Components/Table/Table.Body",
    component: Table,
    subcomponents: {
        Body: Table.Body,
    },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => <Table.Body>Table Body Content</Table.Body>,
};
