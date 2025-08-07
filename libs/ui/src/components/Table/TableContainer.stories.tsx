import type { Meta, StoryObj } from "@storybook/react-webpack5";
import React from "react";
import { Table } from "./index";

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
