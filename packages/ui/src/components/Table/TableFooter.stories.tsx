import React from "react";
import { Table } from "./";

export default {
    title: "Components/Table/Table.Footer",
    component: Table,
    subcomponents: {
        Pagination: Table.Footer,
    },
};

const Template = (args) => {
    return <Table.Footer {...args}>Table Footer</Table.Footer>;
};

export const Default = Template.bind({});

Default.args = {};
