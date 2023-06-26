import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Table } from "../Table/index";
import { Box } from "../Box/index";
import { IconButton } from "../IconButton/index";
import { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import Collapse from "@mui/material/Collapse";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import Typography from "@mui/material/Typography";

const meta: Meta<typeof Table> = {
    title: "Components/Table",
    component: Table,
};

export default meta;

type Story = StoryObj<typeof Table>;

function createData(
    name: string,
    age: number,
    location: string,
    email: string,
    number: string,
) {
    return {
        name,
        age,
        location,
        email,
        number,
        history: [
            {
                date: "2020-01-05",
                customerId: "11091700",
                amount: 3,
            },
            {
                date: "2020-01-02",
                customerId: "Anonymous",
                amount: 1,
            },
        ],
    };
}

const rows = [
    createData(
        "John Smith",
        19,
        "Rosslyn, VA",
        "j.smith@deloitte.com",
        "555-555-5555",
    ),
    createData(
        "Jane Smith",
        20,
        "Salem, WA",
        "ja.smith@deloitte.com",
        "555-555-5555",
    ),
    createData(
        "Robert Smith",
        21,
        "Portland, OR",
        "r.smith@deloitte.com",
        "555-555-5555",
    ),
    createData(
        "Claire Smith",
        22,
        "Tucson, AZ",
        "c.smith@deloitte.com",
        "555-555-5555",
    ),
    createData(
        "Jane Smith",
        23,
        "Denver, CO",
        "ne.smith@deloitte.com",
        "555-555-5555",
    ),
];

function BasicTable(args) {
    return (
        <Table.Container>
            <Table sx={{ minWidth: 650 }} aria-label="simple table" {...args}>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell>Name</Table.Cell>
                        <Table.Cell align="right">Age</Table.Cell>
                        <Table.Cell align="right">Location</Table.Cell>
                        <Table.Cell align="right">Email</Table.Cell>
                        <Table.Cell align="right">Number</Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Table.Row
                            key={row.name}
                            sx={{
                                "&:last-child td, &:last-child th": {
                                    border: 0,
                                },
                            }}
                        >
                            <Table.Cell component="th" scope="row">
                                {row.name}
                            </Table.Cell>
                            <Table.Cell align="right">{row.age}</Table.Cell>
                            <Table.Cell align="right">
                                {row.location}
                            </Table.Cell>
                            <Table.Cell align="right">{row.email}</Table.Cell>
                            <Table.Cell align="right">{row.number}</Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        </Table.Container>
    );
}

function DenseTable() {
    const StyledTableCell = styled(Table.Cell)(({ theme }) => ({
        [`&.${tableCellClasses.head}`]: {
            backgroundColor: "#40a0ff",
            color: theme.palette.common.white,
        },
        [`&.${tableCellClasses.body}`]: {
            fontSize: 14,
        },
    }));

    const StyledTableRow = styled(Table.Row)(({ theme }) => ({
        "&:nth-of-type(odd)": {
            backgroundColor: theme.palette.action.hover,
        },
        // hide last border
        "&:last-child td, &:last-child th": {
            border: 0,
        },
    }));
    return (
        <Table.Container>
            <Table
                sx={{ minWidth: 650 }}
                size="small"
                aria-label="a dense table"
            >
                <Table.Head>
                    <Table.Row>
                        <StyledTableCell>Name</StyledTableCell>
                        <StyledTableCell align="right">Age</StyledTableCell>
                        <StyledTableCell align="right">
                            Location
                        </StyledTableCell>
                        <StyledTableCell align="right">Email</StyledTableCell>
                        <StyledTableCell align="right">Number</StyledTableCell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <StyledTableRow
                            key={row.name}
                            sx={{
                                "&:last-child td, &:last-child th": {
                                    border: 0,
                                },
                            }}
                        >
                            <StyledTableCell component="th" scope="row">
                                {row.name}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                                {row.age}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                                {row.location}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                                {row.email}
                            </StyledTableCell>
                            <StyledTableCell align="right">
                                {row.number}
                            </StyledTableCell>
                        </StyledTableRow>
                    ))}
                </Table.Body>
            </Table>
        </Table.Container>
    );
}

function Row(props) {
    const { row } = props;
    const [open, setOpen] = useState(false);

    return (
        <>
            <Table.Row sx={{ "& > *": { borderBottom: "unset" } }}>
                <Table.Cell>
                    <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? (
                            <KeyboardArrowUpIcon />
                        ) : (
                            <KeyboardArrowDownIcon />
                        )}
                    </IconButton>
                </Table.Cell>
                <Table.Cell>{row.name}</Table.Cell>
                <Table.Cell align="left">{row.age}</Table.Cell>
                <Table.Cell align="left">{row.location}</Table.Cell>
                <Table.Cell align="left">{row.email}</Table.Cell>
                <Table.Cell align="left">{row.number}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell
                    style={{ paddingBottom: 0, paddingTop: 0 }}
                    colSpan={6}
                >
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography
                                variant="h6"
                                gutterBottom
                                component="div"
                            >
                                History
                            </Typography>
                            <Table size="small" aria-label="purchases">
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell>Date</Table.Cell>
                                        <Table.Cell>Customer</Table.Cell>
                                        <Table.Cell align="right">
                                            Amount
                                        </Table.Cell>
                                        <Table.Cell align="right">
                                            Total price ($)
                                        </Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {row.history.map((historyRow) => (
                                        <Table.Row key={historyRow.date}>
                                            <Table.Cell
                                                component="th"
                                                scope="row"
                                            >
                                                {historyRow.date}
                                            </Table.Cell>
                                            <Table.Cell>
                                                {historyRow.customerId}
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                {historyRow.amount}
                                            </Table.Cell>
                                            <Table.Cell align="right">
                                                {Math.round(
                                                    historyRow.amount * 100,
                                                ) / 50}
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table>
                        </Box>
                    </Collapse>
                </Table.Cell>
            </Table.Row>
        </>
    );
}

function CollapsibleTable() {
    return (
        <Table.Container>
            <Table aria-label="collapsible table">
                <Table.Head>
                    <Table.Row>
                        <Table.Cell align="left">
                            <></>
                        </Table.Cell>
                        <Table.Cell align="left">Name</Table.Cell>
                        <Table.Cell align="left">Age</Table.Cell>
                        <Table.Cell align="left">Location</Table.Cell>
                        <Table.Cell align="left">Email</Table.Cell>
                        <Table.Cell align="left">Phone Number</Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {rows.map((row) => (
                        <Row key={row.name} row={row} />
                    ))}
                </Table.Body>
            </Table>
        </Table.Container>
    );
}

export const Default: Story = {
    render: (args) => <BasicTable {...args} />,
};

export const Dense: Story = {
    render: () => <DenseTable />,
};

export const CollapsibleTableExample: Story = {
    render: () => <CollapsibleTable />,
};
