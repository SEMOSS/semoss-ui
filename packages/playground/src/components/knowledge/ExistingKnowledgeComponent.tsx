import React from 'react';
import { styled, Stack, Table, Typography, CircularProgress } from '@semoss/ui';
import { usePixel } from '@semoss/sdk/react';

import { Engine } from '@/types';

const StyledTableHolder = styled(Stack)(({ theme }) => ({
    height: '376px',
    width: '100%',
}));

const StyledTableCell = styled(Table.Cell)(() => ({
    '&[data-col="name"]': {
        '& > p': {
            width: '200px',
        },
    },
    '&[data-col="date"]': {},
    '&[data-col="size"]': {
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
                <Typography
                    variant="body2"
                    sx={{
                        color: 'text.secondary',
                    }}
                >
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
                        <Table.Container sx={{ flex: 1 }}>
                            <Table stickyHeader size="small" sx={{ flex: 1 }}>
                                <Table.Head>
                                    <Table.Row>
                                        <StyledTableCell data-col="name">
                                            Name
                                        </StyledTableCell>
                                        <StyledTableCell data-col="date">
                                            Date Modified
                                        </StyledTableCell>
                                        <StyledTableCell data-col="size">
                                            Size
                                        </StyledTableCell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {getFiles.data?.map((f, fIdx) => {
                                        return (
                                            <Table.Row key={fIdx}>
                                                <StyledTableCell data-col="name">
                                                    <Typography
                                                        variant="body2"
                                                        noWrap={true}
                                                    >
                                                        {f.fileName}
                                                    </Typography>
                                                </StyledTableCell>
                                                <StyledTableCell data-col="date">
                                                    {f.lastModified}
                                                </StyledTableCell>
                                                <StyledTableCell data-col="size">
                                                    {f.fileSize}
                                                </StyledTableCell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                            </Table>
                        </Table.Container>
                    )}
                </StyledTableHolder>
            </>
        );
    };
