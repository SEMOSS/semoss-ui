import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled as styledOld,
    Table as TableOld,
    Scroll as ScrollOld,
    Icon,
} from '@semoss/components';
import { MenuItem } from '@semoss/ui/src/components/Menu/MenuItem';
import {
    Button,
    styled,
    Chip,
    Select,
    Stack,
    Typography,
    Table,
} from '@semoss/ui';
import { ArrowCircleDown } from '@mui/icons-material';
import { mdiPencil } from '@mdi/js';

import { theme } from '@/theme';
import { usePixel, useDatabase, useRootStore } from '@/hooks';
import { Section } from '@/components/ui';
import { Metamodel, MetamodelNode } from '@/components/metamodel';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    zIndex: '0',
}));

const StyledMetamodelContainer = styled('section')(({ theme }) => ({
    height: '55vh',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    // borderColor: theme.palette.outline, // TODO: create a theme variable
    borderRadius: theme.shape.borderRadius,
}));

const StyledSelect = styled(Select)(() => ({
    maxWidth: '200px',
}));

const StyledTableContainer = styled(Table.Container)(() => ({
    height: '396px',
}));

const StyledTableScroll = styledOld(ScrollOld, {
    height: '250px',
    width: '100%',
    borderColor: theme.colors['grey-4'],
    borderWidth: theme.borderWidths.default,
    borderStyle: 'solid',
    borderRadius: theme.radii.default,
});

const StyledTableCell = styledOld(TableOld.Cell, {
    variants: {
        type: {
            icon: {
                width: theme.space['8'],
            },
            name: {
                width: theme.space['40'],
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            },
            description: {
                fontSize: theme.fontSizes.sm,
                width: theme.space['80'],
                overflow: 'hidden',
            },
        },
    },
});

const StyledTableDescription = styledOld('div', {
    fontSize: theme.fontSizes.sm,
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': 3,
});

export const DatabaseMetadataPage = observer(() => {
    const { id } = useDatabase();

    const { monolithStore } = useRootStore();

    // track the selected node
    const [selectedNode, setSelectedNode] =
        useState<React.ComponentProps<typeof Metamodel>['selectedNode']>(null);
    const [columnPage, setColumnPage] = useState<number>(0);
    const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

    // get the metadata
    const getDatabaseMetamodel = usePixel<{
        dataTypes: Record<string, 'INT' | 'DOUBLE' | 'STRING'>;
        logicalNames: Record<string, string[]>;
        nodes: { propSet: string[]; conceptualName: string }[];
        edges: {
            sourceColumn?: string;
            targetColumn?: string;
            relation: string;
            source: string;
            target: string;
        }[];
        physicalTypes: Record<string, string>;
        positions: Record<
            string,
            {
                top: number;
                left: number;
            }
        >;
        descriptions: Record<string, string>;
        additionalDataTypes: Record<string, 'INT' | 'FLOAT' | 'VARCHAR(2000)'>;
    }>(
        `GetDatabaseMetamodel( database=["${id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"]); `,
    );

    // get the data if a table is selected
    const getData = usePixel<{
        data: {
            values: (string | number | boolean)[][];
            headers: string[];
        };
        headerInfo: {
            dataType: string;
            additionalDataType: string;
            alias: string;
            header: string;
            type: string;
            derived: boolean;
        }[];
        numCollected: number;
    }>(
        selectedNode && selectedNode.data.properties.length > 0
            ? `Database(database=["${id}"]) | Select(${selectedNode.data.properties
                  .map((p) => p.id)
                  .join(', ')}) | Collect(100);`
            : '',
        {
            data: {
                data: {
                    values: [],
                    headers: [],
                },
                headerInfo: [],
                numCollected: 0,
            },
        },
    );

    // format the nodes
    const nodes: React.ComponentProps<typeof Metamodel>['nodes'] =
        useMemo(() => {
            if (getDatabaseMetamodel.status !== 'SUCCESS') {
                return [];
            }

            // extract the required information
            const { nodes = [], positions = {} } = getDatabaseMetamodel.data;

            return nodes.map((n) => {
                const node = n.conceptualName;

                return {
                    id: node,
                    type: 'metamodel',
                    data: {
                        name: String(n.conceptualName).replace(/_/g, ' '),
                        properties: n.propSet.map((p) => {
                            const property = `${node}__${p}`;

                            return {
                                id: property,
                                name: String(p).replace(/_/g, ' '),
                                type: '',
                            };
                        }),
                    },
                    position: positions[node]
                        ? {
                              x: positions[node].left,
                              y: positions[node].top,
                          }
                        : {
                              x: 0,
                              y: 0,
                          },
                };
            });
        }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    // format the edges
    const edges: React.ComponentProps<typeof Metamodel>['edges'] =
        useMemo(() => {
            if (getDatabaseMetamodel.status !== 'SUCCESS') {
                return [];
            }
            const data = getDatabaseMetamodel.data;

            return data.edges.map((e) => {
                return {
                    id: e.relation,
                    type: 'floating',
                    source: e.source,
                    target: e.target,
                };
            });
        }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    // format the column rows
    const columnRows = useMemo(() => {
        if (
            !selectedNode ||
            !selectedNode.data ||
            !selectedNode.data.properties ||
            selectedNode.data.properties.length === 0
        ) {
            return [];
        }

        return selectedNode.data.properties.slice(
            columnPage * columnVisibleRows,
            (columnPage + 1) * columnVisibleRows,
        );
    }, [selectedNode, columnPage, columnVisibleRows]);

    // get the description + logical names if possible
    const description =
        selectedNode &&
        getDatabaseMetamodel.data &&
        getDatabaseMetamodel.data.descriptions &&
        getDatabaseMetamodel.data.descriptions[selectedNode.id]
            ? getDatabaseMetamodel.data.descriptions[selectedNode.id]
            : '';

    const logical: string[] =
        selectedNode &&
        getDatabaseMetamodel.data &&
        getDatabaseMetamodel.data.logicalNames &&
        getDatabaseMetamodel.data.logicalNames[selectedNode.id]
            ? getDatabaseMetamodel.data.logicalNames[selectedNode.id]
            : [];

    /**
     * @name printMeta
     * @desc export DB pixel
     */
    const printMeta = () => {
        const pixel = `META|DatabaseMetadataToPdf(database=["${id}"] );`;
        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output,
                insightID = response.insightID;

            monolithStore.download(insightID, output);
        });
    };

    return (
        <StyledPage>
            <Section>
                <Section.Header
                    actions={
                        <Button
                            startIcon={<ArrowCircleDown />}
                            variant="outlined"
                            onClick={() => printMeta()}
                        >
                            Print Metadata
                        </Button>
                    }
                >
                    Metamodel
                </Section.Header>
                <Stack spacing={2}>
                    {/* <StyledSelect
                        value={selectedNode || ''}
                        onChange={(e) => {
                            setSelectedNode(e.target.value as MetamodelNode);
                        }}
                        renderValue={(n: MetamodelNode) => n.data.name}
                        multiple={false}
                    >
                        {nodes.map((n) => {
                            return (
                                //@ts-expect-error This is an error in the component
                                <MenuItem key={n.id} value={n}>
                                    {n.data.name}
                                </MenuItem>
                            );
                        })}
                    </StyledSelect> */}
                    <StyledMetamodelContainer>
                        <Metamodel
                            nodes={nodes}
                            edges={edges}
                            selectedNode={selectedNode}
                            onSelectNode={(n) => {
                                setSelectedNode(n);
                            }}
                        />
                    </StyledMetamodelContainer>
                </Stack>
            </Section>

            {selectedNode && (
                <Section>
                    <Section.Header>Description</Section.Header>
                    <Typography variant="body2">{description}</Typography>
                </Section>
            )}

            {selectedNode && (
                <Section>
                    <Section.Header>Logical Names</Section.Header>
                    <Stack direction={'row'} spacing={1} flexWrap={'wrap'}>
                        {logical.map((logicalName) => {
                            return (
                                <Chip
                                    key={logicalName}
                                    label={logicalName}
                                    color={'primary'}
                                    variant={'outlined'}
                                    size={'small'}
                                ></Chip>
                            );
                        })}
                    </Stack>
                </Section>
            )}

            {selectedNode && (
                <Section>
                    <Section.Header>Columns</Section.Header>
                    <StyledTableContainer>
                        <Table stickyHeader>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell>&nbsp;</Table.Cell>
                                    <Table.Cell>Name</Table.Cell>
                                    <Table.Cell>Description</Table.Cell>
                                    <Table.Cell>Logical Names</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {columnRows.map((property, idx) => {
                                    const { id, name } = property;

                                    const description =
                                        getDatabaseMetamodel.data &&
                                        getDatabaseMetamodel.data
                                            .descriptions &&
                                        getDatabaseMetamodel.data.descriptions[
                                            id
                                        ]
                                            ? getDatabaseMetamodel.data
                                                  .descriptions[id]
                                            : '';

                                    const logical: string[] =
                                        getDatabaseMetamodel.data &&
                                        getDatabaseMetamodel.data
                                            .logicalNames &&
                                        getDatabaseMetamodel.data.logicalNames[
                                            id
                                        ]
                                            ? getDatabaseMetamodel.data
                                                  .logicalNames[id]
                                            : [];

                                    return (
                                        <Table.Row key={idx}>
                                            <Table.Cell>
                                                <Icon path={mdiPencil}></Icon>
                                            </Table.Cell>
                                            <Table.Cell>{name}</Table.Cell>
                                            <Table.Cell>
                                                <Typography variant={'caption'}>
                                                    {description}
                                                </Typography>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Stack
                                                    direction={'row'}
                                                    spacing={1}
                                                    flexWrap={'wrap'}
                                                >
                                                    {logical.map(
                                                        (logicalName) => {
                                                            return (
                                                                <Chip
                                                                    key={
                                                                        logicalName
                                                                    }
                                                                    label={
                                                                        logicalName
                                                                    }
                                                                    color={
                                                                        'primary'
                                                                    }
                                                                    variant={
                                                                        'outlined'
                                                                    }
                                                                    size={
                                                                        'small'
                                                                    }
                                                                ></Chip>
                                                            );
                                                        },
                                                    )}
                                                </Stack>
                                            </Table.Cell>
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                            <Table.Footer>
                                <Table.Row>
                                    <Table.Pagination
                                        onPageChange={(e, v) => {
                                            setColumnPage(v);
                                        }}
                                        page={columnPage}
                                        rowsPerPage={columnVisibleRows}
                                        onRowsPerPageChange={(e) => {
                                            setColumnVisibleRows(
                                                e.target
                                                    .value as unknown as number,
                                            );
                                        }}
                                        count={
                                            selectedNode.data.properties.length
                                        }
                                        rowsPerPageOptions={[7, 10, 25]}
                                    />
                                </Table.Row>
                            </Table.Footer>
                        </Table>
                    </StyledTableContainer>
                </Section>
            )}
            {selectedNode && getData.status === 'SUCCESS' && (
                <Section>
                    <Section.Header>Data</Section.Header>
                    <StyledTableScroll>
                        <TableOld sticky={true} border={false} layout="fixed">
                            <TableOld.Head>
                                <TableOld.Row>
                                    {getData.data.data.headers.map((h) => {
                                        return (
                                            <TableOld.Cell key={h}>
                                                {String(h).replace(/_/g, ' ')}
                                            </TableOld.Cell>
                                        );
                                    })}
                                </TableOld.Row>
                            </TableOld.Head>
                            <TableOld.Body>
                                {getData.data.data.values.map((v, vIdx) => {
                                    return (
                                        <TableOld.Row key={vIdx}>
                                            {getData.data.data.headers.map(
                                                (h, hIdx) => {
                                                    return (
                                                        <TableOld.Cell
                                                            key={`${vIdx}-${hIdx}`}
                                                        >
                                                            {v[hIdx]}
                                                        </TableOld.Cell>
                                                    );
                                                },
                                            )}
                                        </TableOld.Row>
                                    );
                                })}
                            </TableOld.Body>
                        </TableOld>
                    </StyledTableScroll>
                </Section>
            )}
        </StyledPage>
    );
});
