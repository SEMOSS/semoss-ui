import React, { useMemo, useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import {
    Button,
    styled,
    Chip,
    Stack,
    Typography,
    Table,
    IconButton,
} from '@semoss/ui';
import { ArrowCircleDown, Create } from '@mui/icons-material';
import { usePixel, useEngine, useRootStore } from '@/hooks';
import { Section } from '@/components/ui';
import { Metamodel } from '@/components/metamodel';
import { SyncChangesModal } from './SyncChangesModal';

const StyledPage = styled('div')(() => ({
    position: 'relative',
    zIndex: '0',
}));

const StyledMetamodelContainer = styled('section')(({ theme }) => ({
    height: '55vh',
    width: '100%',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderRadius: theme.shape.borderRadius,
}));

const StyledTableContainer = styled(Table.Container)(() => ({
    height: '396px',
}));

export const EngineMetadataPage = observer(() => {
    const { id } = useEngine();
    const { monolithStore } = useRootStore();

    const [selectedNode, setSelectedNode] = useState(null);
    const [columnPage, setColumnPage] = useState<number>(0);
    const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

    const [customNodes, setCustomNodes] = useState(null);
    const [customEdges, setCustomEdges] = useState(null);

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

    const defaultNodes = useMemo(() => {
        if (getDatabaseMetamodel.status !== 'SUCCESS') return [];
        const { nodes = [], positions = {} } = getDatabaseMetamodel.data;
        return nodes.map((n) => ({
            id: n.conceptualName,
            type: 'metamodel',
            data: {
                name: n.conceptualName.replace(/_/g, ' '),
                properties: n.propSet.map((p) => ({
                    id: `${n.conceptualName}__${p}`,
                    name: p.replace(/_/g, ' '),
                    type: '',
                })),
            },
            position: positions[n.conceptualName]
                ? {
                      x: positions[n.conceptualName].left,
                      y: positions[n.conceptualName].top,
                  }
                : { x: 0, y: 0 },
        }));
    }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    const defaultEdges = useMemo(() => {
        if (getDatabaseMetamodel.status !== 'SUCCESS') return [];
        return getDatabaseMetamodel.data.edges.map((e) => ({
            id: e.relation,
            type: 'floating',
            source: e.source,
            target: e.target,
        }));
    }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

    const [showSyncModal, setShowSyncModal] = useState(false);
    const [tabledata, setTabledata] = useState<string[]>([]);
    const [viewdata, setViewdata] = useState<string[]>([]);

    const refreshData = () => {
        const pixel = `ExternalUpdateJdbcTablesAndViews(database=["${id}"]);`;
        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output;
            setTabledata(output.tables ?? []);
            setViewdata(output.views ?? []);
            setShowSyncModal(true);
        });
    };

    const handleSyncApply = (
        selectedTables: string[],
        selectedViews: string[],
    ) => {
        const filters = JSON.stringify([...selectedTables, ...selectedViews]);
        const pixel = `ExternalUpdateJdbcSchema(database=["${id}"], filters=${filters});`;

        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0]?.output;
            if (!output) return;

            const newNodes = output.tables.map((table) => ({
                id: table.table,
                type: 'metamodel',
                data: {
                    name: table.table.replace(/_/g, ' '),
                    properties: table.columns.map((col, idx) => ({
                        id: `${table.table}__${col}`,
                        name: col.replace(/_/g, ' '),
                        type: table.type?.[idx] || '',
                    })),
                },
                position: output.positions?.[table.table]
                    ? {
                          x: output.positions[table.table].left,
                          y: output.positions[table.table].top,
                      }
                    : { x: 0, y: 0 },
            }));

            const newEdges = (output.relationships || []).map((rel, i) => ({
                id: `${rel.fromTable}-${rel.toTable}-${i}`,
                type: 'floating',
                source: rel.fromTable,
                target: rel.toTable,
            }));

            setCustomNodes(newNodes);
            setCustomEdges(newEdges);
            setShowSyncModal(false);
        });
    };

    const columnRows = useMemo(() => {
        if (!selectedNode?.data?.properties?.length) return [];
        return selectedNode.data.properties.slice(
            columnPage * columnVisibleRows,
            (columnPage + 1) * columnVisibleRows,
        );
    }, [selectedNode, columnPage, columnVisibleRows]);

    const description = selectedNode?.id
        ? getDatabaseMetamodel.data?.descriptions?.[selectedNode.id] ?? ''
        : '';

    const logical = selectedNode?.id
        ? getDatabaseMetamodel.data?.logicalNames?.[selectedNode.id] ?? []
        : [];

    const printMeta = () => {
        const pixel = `META|DatabaseMetadataToPdf(database=["${id}"]);`;
        monolithStore.runQuery(pixel).then((response) => {
            const output = response.pixelReturn[0].output;
            const insightId = response.insightId;
            monolithStore.download(insightId, output);
        });
    };

    return (
        <StyledPage>
            <Section>
                <Section.Header
                    actions={
                        <Stack direction="row" spacing={2}>
                            <Button variant="outlined" onClick={refreshData}>
                                Refresh Data
                            </Button>
                            <Button
                                startIcon={<ArrowCircleDown />}
                                variant="outlined"
                                onClick={printMeta}
                                data-testid={'engine-metadata-print-btn'}
                            >
                                Print Metadata
                            </Button>
                        </Stack>
                    }
                >
                    Metamodel
                </Section.Header>
                <Stack spacing={2}>
                    <StyledMetamodelContainer>
                        <Metamodel
                            nodes={customNodes ?? defaultNodes}
                            edges={customEdges ?? defaultEdges}
                            selectedNode={selectedNode}
                            onSelectNode={setSelectedNode}
                            isInteractive={true}
                        />
                    </StyledMetamodelContainer>
                </Stack>
            </Section>

            {selectedNode && (
                <>
                    <Section>
                        <Section.Header>Description</Section.Header>
                        <Typography variant="body2">{description}</Typography>
                    </Section>

                    <Section>
                        <Section.Header>Logical Names</Section.Header>
                        <Stack direction="row" spacing={1} flexWrap="wrap">
                            {logical.map((name) => (
                                <Chip
                                    key={name}
                                    label={name}
                                    color="primary"
                                    size="small"
                                />
                            ))}
                        </Stack>
                    </Section>

                    <Section>
                        <Section.Header>Columns</Section.Header>
                        <StyledTableContainer>
                            <Table stickyHeader>
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell />
                                        <Table.Cell>Name</Table.Cell>
                                        <Table.Cell>Description</Table.Cell>
                                        <Table.Cell>Logical Names</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {columnRows.map((property, idx) => {
                                        const desc =
                                            getDatabaseMetamodel.data
                                                ?.descriptions?.[property.id] ||
                                            '';
                                        const logic =
                                            getDatabaseMetamodel.data
                                                ?.logicalNames?.[property.id] ||
                                            [];
                                        return (
                                            <Table.Row key={idx}>
                                                <Table.Cell>
                                                    <IconButton disabled>
                                                        <Create />
                                                    </IconButton>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    {property.name}
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Typography variant="caption">
                                                        {desc}
                                                    </Typography>
                                                </Table.Cell>
                                                <Table.Cell>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        flexWrap="wrap"
                                                    >
                                                        {logic.map((ln) => (
                                                            <Chip
                                                                key={ln}
                                                                label={ln}
                                                                color="primary"
                                                                size="small"
                                                            />
                                                        ))}
                                                    </Stack>
                                                </Table.Cell>
                                            </Table.Row>
                                        );
                                    })}
                                </Table.Body>
                                <Table.Footer>
                                    <Table.Row>
                                        <Table.Pagination
                                            page={columnPage}
                                            count={
                                                selectedNode?.data?.properties
                                                    ?.length || 0
                                            }
                                            rowsPerPage={columnVisibleRows}
                                            rowsPerPageOptions={[7, 10, 25]}
                                            onPageChange={(e, v) =>
                                                setColumnPage(v)
                                            }
                                            onRowsPerPageChange={(e) =>
                                                setColumnVisibleRows(
                                                    e.target
                                                        .value as unknown as number,
                                                )
                                            }
                                        />
                                    </Table.Row>
                                </Table.Footer>
                            </Table>
                        </StyledTableContainer>
                    </Section>
                </>
            )}

            {selectedNode && getData.status === 'SUCCESS' && (
                <Section>
                    <Section.Header>Data</Section.Header>
                    <StyledTableContainer>
                        <Table stickyHeader>
                            <Table.Head>
                                <Table.Row>
                                    {getData.data.data.headers.map((h) => (
                                        <Table.Cell key={h}>
                                            {h.replace(/_/g, ' ')}
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {getData.data.data.values.map((row, i) => (
                                    <Table.Row key={i}>
                                        {row.map((val, j) => (
                                            <Table.Cell key={j}>
                                                {val}
                                            </Table.Cell>
                                        ))}
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </StyledTableContainer>
                </Section>
            )}

            <SyncChangesModal
                open={showSyncModal}
                onClose={() => setShowSyncModal(false)}
                onApply={handleSyncApply}
                tables={tabledata}
                views={viewdata}
            />
        </StyledPage>
    );
});
