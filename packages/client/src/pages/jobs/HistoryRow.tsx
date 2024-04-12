import { useState } from 'react';
import {
    styled,
    Table,
    IconButton,
    Collapse,
    Box,
    Stack,
    Typography,
} from '@semoss/ui';
import { KeyboardArrowDown, ChevronRight } from '@mui/icons-material';
import { Chip } from '@mui/material';

const StyledExpandTableCell = styled(Table.Cell)(({ theme }) => ({
    padding: 0,
}));
const StyledBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(1),
    margin: theme.spacing(1),
    borderRadius: theme.spacing(3),
    backgroundColor: '#F0F0F0',
}));

export const HistoryRow = (props: {
    row: {
        jobName: string;
        execStart: string;
        execDelta: string;
        success: boolean;
        schedulerOutput: string;
    };
}) => {
    const { row } = props;
    const [open, setOpen] = useState(false);

    return (
        <>
            <Table.Row>
                <Table.Cell>
                    <IconButton size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowDown /> : <ChevronRight />}
                    </IconButton>
                </Table.Cell>
                <Table.Cell>{row.jobName}</Table.Cell>
                <Table.Cell>{row.execStart}</Table.Cell>
                <Table.Cell>{row.execDelta}</Table.Cell>
                <Table.Cell>
                    <Chip
                        label={row.success ? 'Success' : 'Failed'}
                        avatar={null}
                        variant="filled"
                        color={row.success ? 'success' : 'error'}
                    />
                </Table.Cell>
            </Table.Row>
            <Table.Row>
                <StyledExpandTableCell colSpan={6}>
                    <Collapse in={open} timeout="auto">
                        <Stack padding={2} spacing={2}>
                            <Typography variant="subtitle1">Output:</Typography>
                            <StyledBox>{row.schedulerOutput}</StyledBox>
                        </Stack>
                    </Collapse>
                </StyledExpandTableCell>
            </Table.Row>
        </>
    );
};
