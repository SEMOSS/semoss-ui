import React, { useMemo, useState, useContext } from 'react';
import { styled } from '@semoss/components';
import { theme } from '@/theme';
import { usePixel } from '@/hooks';
import { Metamodel } from '@/components/metamodel';
import { ImportedDatabaseContext } from '@/contexts/ImportedDatabaseContext';

const StyledMetamodelContainer = styled('div', {
    height: '55vh',
    width: '100%',
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
});
export const ImportedDatabaseMetaModelPage = () => {
    const { id } = useContext(ImportedDatabaseContext);
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
        <div>
            {' '}
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
        </div>
    );
};
