import { Table, Box, IconButton } from '@/component-library';
import { HighlightOffRounded, EditRounded } from '@mui/icons-material/';

export const DataFormTable = (props) => {
    const { predictDataTypes } = props;
    const headers =
        predictDataTypes && predictDataTypes.pixelReturn[0].output.cleanHeaders;
    const dataTypes =
        predictDataTypes &&
        Object.values(predictDataTypes.pixelReturn[0].output.dataTypes);
    return (
        <Table size="small">
            <Table.Head>
                <Table.Row>
                    <Table.Cell>Name</Table.Cell>
                    <Table.Cell>Data Type</Table.Cell>
                    <Table.Cell>&nbsp;</Table.Cell>
                </Table.Row>
            </Table.Head>
            <Table.Body>
                {headers.map((header, idx) => {
                    return (
                        <Table.Row key={idx}>
                            <Table.Cell>{header}</Table.Cell>
                            <Table.Cell>
                                <Box
                                    sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        width: '50%',
                                    }}
                                >
                                    {dataTypes[idx]}
                                    <IconButton>
                                        <EditRounded />
                                    </IconButton>
                                </Box>
                            </Table.Cell>
                            <Table.Cell>
                                <IconButton>
                                    <HighlightOffRounded />
                                </IconButton>
                            </Table.Cell>
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table>
    );
};

export default DataFormTable;
