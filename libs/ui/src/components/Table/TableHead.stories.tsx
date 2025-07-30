import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Table } from "./index";

const meta: Meta<typeof Table> = {
    title: "Components/Table/Table.Head",
    component: Table,
    subcomponents: {
        Head: Table.Head,
    },
};

export default meta;

type Story = StoryObj<typeof Table>;

export const Default: Story = {
    render: () => <Table.Head>Table Head Content</Table.Head>,
};
