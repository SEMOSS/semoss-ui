import React from 'react';
import {
    styled,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    CircularProgress,
} from '@mui/material';

import { Engine } from '@/types';
import { usePixel } from '@/hooks';

const StyledTableHolder = styled(Stack)(({ theme }) => ({
    height: '376px',
    width: '100%',
}));

const StyledTableCell = styled(TableCell)(() => ({
    '&.name': {
        '& > p': {
            width: '200px',
        },
    },
    '&.date': {},
    '&.size': {
        width: '80px',
    },
}));

interface ExistingKnowledgeComponentProps {
    /** Knowledge loaded into the room */
    engine: Engine | null;
}

export const ExistingKnowledgeComponent: React.FC<ExistingKnowledgeComponentProps> =
    (props) => {
        const { engine } = props;

        /**
         * Get all of the files
         */
        const getFiles = usePixel<
            { fileName: string; lastModified: string; fileSize: string }[]
        >(
            engine
                ? `ListDocumentsInVectorDatabase(engine="${engine.app_id}")`
                : '',
            {
                data: [],
            },
        );

        return (
            <>
                <Typography variant="body2" color={'text.secondary'}>
                    {engine?.description}
                </Typography>
                <StyledTableHolder direction={'column'} spacing={2}>
                    <Typography variant="subtitle1">Files</Typography>
                    {getFiles.status === 'LOADING' && (
                        <Stack
                            flex={1}
                            width={'100%'}
                            alignItems={'center'}
                            justifyContent={'center'}
                        >
                            <CircularProgress color="primary" />
                        </Stack>
                    )}
                    {getFiles.status !== 'LOADING' && (
                        <TableContainer sx={{ flex: 1 }}>
                            <Table stickyHeader size="small" sx={{ flex: 1 }}>
                                <TableHead>
                                    <TableRow>
                                        <StyledTableCell className="name">
                                            Name
                                        </StyledTableCell>
                                        <StyledTableCell className="date">
                                            Date Modified
                                        </StyledTableCell>
                                        <StyledTableCell className="size">
                                            Size
                                        </StyledTableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {getFiles.data?.map((f, fIdx) => {
                                        return (
                                            <TableRow key={fIdx} hover={true}>
                                                <StyledTableCell className="name">
                                                    <Typography
                                                        variant="body2"
                                                        noWrap={true}
                                                    >
                                                        {f.fileName}
                                                    </Typography>
                                                </StyledTableCell>
                                                <StyledTableCell className="date">
                                                    {f.lastModified}
                                                </StyledTableCell>
                                                <StyledTableCell className="size">
                                                    {f.fileSize}
                                                </StyledTableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </StyledTableHolder>
            </>
        );
    };
