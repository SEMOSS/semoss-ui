import React from "react";
import { Table } from "./";

export default {
    title: "Components/Table/Table.Pagination",
    component: Table,
    subcomponents: {
        Pagination: Table.Pagination,
    },
};

const Template = (args) => {
    return (
        <Table.Pagination
            onPageChange={(e, v) => console.log(e, v)}
            {...args}
        />
    );
};

export const Default = Template.bind({});

Default.args = {
    label: "Default",
    rowsPerPageOptions: [5, 10, 25],
    page: 0,
    rowsPerPage: 5,
    count: 10,
};
