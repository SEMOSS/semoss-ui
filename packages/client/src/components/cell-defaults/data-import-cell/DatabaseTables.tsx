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
    AccessTime,
    DateRange,
    FontDownload,
    KeyboardArrowRight,
    Numbers,
    TableChartOutlined,
} from '@mui/icons-material';

const StyledHeader = styled(Stack)(() => ({
    cursor: 'pointer',
}));
const StyledTableScroll = styled(Stack)(({ theme }) => ({
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
        const retrievedTables = {};
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
            case 'NUMBER':
                return <Numbers />;
            case 'STRING':
            case 'TEXT':
                return <FontDownload />;
            case 'DATE':
            case 'DATETIME':
                return <DateRange />;
            case 'TIME':
                return <AccessTime />;
            default:
                return <></>;
        }
    };

    if (isLoading) {
        return <LinearProgress variant="indeterminate" />;
    }

    return (
        <div>
            {isLoading && <LinearProgress variant="indeterminate" />}
            <Collapse in={!isLoading}>
                <StyledTableScroll direction="row" spacing={2}>
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
                                                            tables[tableName]
                                                                .columnTypes[
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
                </StyledTableScroll>
            </Collapse>
        </div>
    );
};
