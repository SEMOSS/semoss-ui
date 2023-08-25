import { Table, Box, IconButton, styled, Button } from '@semoss/ui';
import { HighlightOffRounded, EditRounded } from '@mui/icons-material/';

const StyledBox = styled(Box)({
    padding: '16px 16px 16px 16px',
});

export const DataFormTable = (props) => {
    const { predictDataTypes, submitFunc } = props;

    const headers =
        predictDataTypes && predictDataTypes.pixelReturn[0].output.cleanHeaders;
    const dataTypes =
        predictDataTypes && predictDataTypes.pixelReturn[0].output.dataTypes
            ? Object.values(predictDataTypes.pixelReturn[0].output.dataTypes)
            : null;
    const multipleSheetDataTypes =
        predictDataTypes && !predictDataTypes.pixelReturn[0].output.dataTypes
            ? Object.values(predictDataTypes.pixelReturn[0].output)
            : null;

    return (
        <>
            {dataTypes && (
                <StyledBox>
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
                                                    justifyContent:
                                                        'space-between',
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
                </StyledBox>
            )}
            {multipleSheetDataTypes &&
                multipleSheetDataTypes.map((sheet, idx) => {
                    const [sheetKey] = Object.keys(sheet);
                    return (
                        <StyledBox key={idx}>
                            <Table size="small">
                                <Table.Head>
                                    <Table.Row>
                                        <Table.Cell>Name</Table.Cell>
                                        <Table.Cell>Data Type</Table.Cell>
                                        <Table.Cell>&nbsp;</Table.Cell>
                                    </Table.Row>
                                </Table.Head>
                                <Table.Body>
                                    {sheet[sheetKey].cleanHeaders.map(
                                        (header, idx) => {
                                            return (
                                                <Table.Row key={idx}>
                                                    <Table.Cell>
                                                        {header}
                                                    </Table.Cell>
                                                    <Table.Cell>
                                                        <Box
                                                            sx={{
                                                                display: 'flex',
                                                                justifyContent:
                                                                    'space-between',
                                                                width: '50%',
                                                            }}
                                                        >
                                                            {
                                                                sheet[sheetKey]
                                                                    .dataTypes[
                                                                    idx
                                                                ]
                                                            }
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
                                        },
                                    )}
                                </Table.Body>
                            </Table>
                        </StyledBox>
                    );
                })}
            <Button variant="contained" onClick={submitFunc}>
                Import
            </Button>
        </>
    );
};

export default DataFormTable;
