import { useState, useMemo } from 'react';
import { usePixel } from '@/hooks';
import {
    styled,
    List,
    Stack,
    Card,
    Divider,
    LinearProgress,
    Typography,
    Collapse,
} from '@semoss/ui';
import {
    DateRange,
    FontDownload,
    Numbers,
    TableChartOutlined,
} from '@mui/icons-material';

const StyledStack = styled(Stack)(({ theme }) => ({
    width: '100%',
    overflow: 'auto',
    padding: theme.spacing(0.5),
}));
const StyledCard = styled(Card)(({ theme }) => ({
    minWidth: theme.spacing(35),
}));
const StyledList = styled(List)(({ theme }) => ({
    maxHeight: theme.spacing(15),
    overflow: 'auto',
}));

export const DatabaseTables = (props: { databaseId: string }) => {
    const [tables, setTables] = useState({});
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const databaseMetamodel = usePixel<{
        dataTypes: Record<string, 'INT' | 'DOUBLE' | 'STRING'>;
        nodes: { propSet: string[]; conceptualName: string }[];
    }>(
        `GetDatabaseMetamodel( database=["${props.databaseId}"], options=["dataTypes"]); `,
    );

    useMemo(() => {
        if (databaseMetamodel.status !== 'SUCCESS') {
            setIsLoading(true);
            return;
        }
        const { nodes = [], dataTypes = {} } = databaseMetamodel.data;
        let retrievedTables = {};
        nodes.forEach((n) => {
            const tableName = n.conceptualName;
            const filteredDataTypes = Object.keys(dataTypes).filter((colName) =>
                colName.includes(`${tableName}__`),
            );
            retrievedTables[n.conceptualName] = {
                columnNames: [...n.propSet],
                columnTypes: filteredDataTypes.reduce((acc, colName) => {
                    acc[colName] = dataTypes[colName];
                    return acc;
                }, {}),
            };
        });
        setTables(retrievedTables);
        setIsLoading(false);
    }, [databaseMetamodel.status, databaseMetamodel.data]);

    const getIconForDataType = (dataType: string) => {
        switch (dataType) {
            case 'INT':
            case 'DOUBLE':
            case 'DECIMAL':
                return <Numbers />;
            case 'STRING':
                return <FontDownload />;
            case 'DATE':
            case 'DATETIME':
                return <DateRange />;
            default:
                return <></>;
        }
    };

    if (isLoading) {
        return <LinearProgress variant="indeterminate" />;
    }

    return (
        <>
            {isLoading && <LinearProgress variant="indeterminate" />}
            <Collapse in={!isLoading}>
                <Stack padding={2} spacing={2}>
                    <Typography variant="subtitle2">
                        {`Tables (${Object.keys(tables).length})`}
                    </Typography>
                    <StyledStack direction="row" spacing={2}>
                        {Array.from(Object.keys(tables), (tableName, index) => {
                            return (
                                <StyledCard key={`${tableName}-${index}`}>
                                    <List.Item>
                                        <List.Icon>
                                            <TableChartOutlined />
                                        </List.Icon>
                                        <List.ItemText primary={tableName} />
                                    </List.Item>
                                    <Divider />
                                    <StyledList disablePadding dense>
                                        {Array.from(
                                            tables[tableName].columnNames,
                                            (columnName, index) => {
                                                return (
                                                    <List.Item
                                                        key={`${columnName}-${index}`}
                                                    >
                                                        <List.Icon>
                                                            {getIconForDataType(
                                                                tables[
                                                                    tableName
                                                                ].columnTypes[
                                                                    `${tableName}__${columnName}`
                                                                ],
                                                            )}
                                                        </List.Icon>
                                                        <List.ItemText
                                                            primary={columnName}
                                                        />
                                                    </List.Item>
                                                );
                                            },
                                        )}
                                    </StyledList>
                                </StyledCard>
                            );
                        })}
                    </StyledStack>
                </Stack>
            </Collapse>
        </>
    );
};
