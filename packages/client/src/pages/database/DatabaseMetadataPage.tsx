import React, { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Select,
    Table,
    Scroll,
    Icon,
    Pill,
    Form,
} from '@semoss/components';
import { mdiPencil } from '@mdi/js';

import { theme } from '@/theme';
import { usePixel, useDatabase } from '@/hooks';
import { Section } from '@/components/ui';
import { Metamodel, MetamodelNode } from '@/components/metamodel';

const StyledPage = styled('div', {
    position: 'relative',
    zIndex: '0',
});

const StyledMetamodelContainer = styled('div', {
    height: '55vh',
    width: '100%',
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
});

const StyledAction = styled('div', {
    marginBottom: theme.space[2],
});

const StyledSelect = styled(Select, {
    maxWidth: '200px',
});

const StyledItem = styled('div', {
    display: 'flex',
    gap: theme.space['2'],
    marginBottom: theme.space['4'],
});

const StyledKey = styled('div', {
    width: theme.space['40'],
    fontWeight: theme.fontWeights.semibold,
    fontSize: theme.fontSizes.sm,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
});

const StyledValue = styled('div', {
    flex: 1,
    flexWrap: 'wrap',
    fontSize: theme.fontSizes.sm,
});

const StyledTableScroll = styled(Scroll, {
    height: '250px',
    width: '100%',
    borderColor: theme.colors['grey-4'],
    borderWidth: theme.borderWidths.default,
    borderRadius: theme.radii.default,
});

const StyledTableCell = styled(Table.Cell, {
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

const StyledTableDescription = styled('div', {
    fontSize: theme.fontSizes.sm,
    display: '-webkit-box',
    overflow: 'hidden',
    '-webkit-box-orient': 'vertical',
    '-webkit-line-clamp': 3,
});

const StyledPillContainer = styled('div', {
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.space['2'],
});

export const DatabaseMetadataPage = observer(() => {
    const { id } = useDatabase();

    // track the selected node
    const [selectedNode, setSelectedNode] =
        useState<React.ComponentProps<typeof Metamodel>['selectedNode']>(null);

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

    // get the description + logical names if possible
    const description =
        selectedNode &&
        getDatabaseMetamodel.data &&
        getDatabaseMetamodel.data.descriptions &&
        getDatabaseMetamodel.data.descriptions[selectedNode.id]
            ? getDatabaseMetamodel.data.descriptions[selectedNode.id]
            : '';

    const logical =
        selectedNode &&
        getDatabaseMetamodel.data &&
        getDatabaseMetamodel.data.logicalNames &&
        getDatabaseMetamodel.data.logicalNames[selectedNode.id]
            ? getDatabaseMetamodel.data.logicalNames[selectedNode.id]
            : [];

    return (
        <StyledPage>
            <Section>
                <Section.Header>Metamodel</Section.Header>
                <StyledAction>
                    <Form>
                        <Form.Field
                            label={'Select a Node to View Details:'}
                            layout="horizontal"
                        >
                            <StyledSelect
                                value={selectedNode}
                                options={nodes}
                                getDisplay={(o: MetamodelNode) => o.data.name}
                                getKey={(o: MetamodelNode) => o.id}
                                onChange={(o: MetamodelNode) =>
                                    setSelectedNode(o)
                                }
                            />
                        </Form.Field>
                    </Form>
                </StyledAction>
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
            </Section>

            {selectedNode && (
                <Section>
                    <Section.Header>Information</Section.Header>

                    <StyledItem>
                        <StyledKey>Description</StyledKey>
                        <StyledValue>{description}</StyledValue>
                    </StyledItem>
                    <StyledItem>
                        <StyledKey>Logical Names</StyledKey>
                        <StyledValue>
                            <StyledPillContainer>
                                {logical.map((logicalName) => {
                                    return (
                                        <Pill
                                            title={logicalName}
                                            key={logicalName}
                                            closeable={false}
                                            color={'primary'}
                                        >
                                            {logicalName}
                                        </Pill>
                                    );
                                })}
                            </StyledPillContainer>
                        </StyledValue>
                    </StyledItem>
                </Section>
            )}

            {selectedNode && (
                <Section>
                    <Section.Header>Columns</Section.Header>
                    <StyledTableScroll>
                        <Table sticky={true} border={false} layout="fixed">
                            <Table.Head>
                                <Table.Row>
                                    <StyledTableCell type={'icon'}>
                                        &nbsp;
                                    </StyledTableCell>
                                    <StyledTableCell type={'name'}>
                                        Name
                                    </StyledTableCell>
                                    <StyledTableCell type={'description'}>
                                        Description
                                    </StyledTableCell>
                                    <Table.Cell>Logical Names</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {selectedNode.data.properties.map(
                                    (property, idx) => {
                                        const { id, name, type } = property;

                                        const description =
                                            getDatabaseMetamodel.data &&
                                            getDatabaseMetamodel.data
                                                .descriptions &&
                                            getDatabaseMetamodel.data
                                                .descriptions[id]
                                                ? getDatabaseMetamodel.data
                                                      .descriptions[id]
                                                : '';

                                        const logical =
                                            getDatabaseMetamodel.data &&
                                            getDatabaseMetamodel.data
                                                .logicalNames &&
                                            getDatabaseMetamodel.data
                                                .logicalNames[id]
                                                ? getDatabaseMetamodel.data
                                                      .logicalNames[id]
                                                : [];

                                        return (
                                            <Table.Row key={idx}>
                                                <StyledTableCell
                                                    title={type}
                                                    type={'icon'}
                                                >
                                                    <Icon
                                                        path={mdiPencil}
                                                    ></Icon>
                                                </StyledTableCell>
                                                <StyledTableCell
                                                    title={name}
                                                    type={'name'}
                                                >
                                                    {name}
                                                </StyledTableCell>
                                                <StyledTableCell
                                                    type={'description'}
                                                    title={description}
                                                >
                                                    <StyledTableDescription>
                                                        {description}
                                                    </StyledTableDescription>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <StyledPillContainer>
                                                        {logical.map(
                                                            (logicalName) => {
                                                                return (
                                                                    <Pill
                                                                        title={
                                                                            logicalName
                                                                        }
                                                                        key={
                                                                            logicalName
                                                                        }
                                                                        closeable={
                                                                            false
                                                                        }
                                                                        color={
                                                                            'primary'
                                                                        }
                                                                    >
                                                                        {
                                                                            logicalName
                                                                        }
                                                                    </Pill>
                                                                );
                                                            },
                                                        )}
                                                    </StyledPillContainer>
                                                </StyledTableCell>
                                            </Table.Row>
                                        );
                                    },
                                )}
                            </Table.Body>
                        </Table>
                    </StyledTableScroll>
                </Section>
            )}
            {selectedNode && getData.status === 'SUCCESS' && (
                <Section>
                    <Section.Header>Data</Section.Header>
                    <StyledTableScroll>
                        <Table sticky={true} border={false} layout="fixed">
                            <Table.Head>
                                <Table.Row>
                                    {getData.data.data.headers.map((h) => {
                                        return (
                                            <Table.Cell key={h}>
                                                {String(h).replace(/_/g, ' ')}
                                            </Table.Cell>
                                        );
                                    })}
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {getData.data.data.values.map((v, vIdx) => {
                                    return (
                                        <Table.Row key={vIdx}>
                                            {getData.data.data.headers.map(
                                                (h, hIdx) => {
                                                    return (
                                                        <Table.Cell
                                                            key={`${vIdx}-${hIdx}`}
                                                        >
                                                            {v[hIdx]}
                                                        </Table.Cell>
                                                    );
                                                },
                                            )}
                                        </Table.Row>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </StyledTableScroll>
                </Section>
            )}
        </StyledPage>
    );
});
