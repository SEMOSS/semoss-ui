import { Table, Typography, styled } from '@semoss/ui';

const UsagePerProject = {
    value: {
        headers: [
            'Total Requests',
            'Total Tokens',
            'PROJECT_NAME',
            'PROJECT_ID',
        ],
        values: [
            [4, 1500, 'Playground V3', '1a3c3b49-8ce4-4e66-bf42-204c3cbbfcb0'],
        ],
    },
};
const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    background: '#FFF',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

export const UsagePerProjectTable = () => {
    return (
        <>
            <Typography variant={'h6'}>Usage Per Project</Typography>
            <StyledTableContainer>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            {UsagePerProject.value.headers.map(
                                (header, index) => (
                                    <Table.Cell key={index}>
                                        {header}
                                    </Table.Cell>
                                ),
                            )}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {UsagePerProject.value.values.map((row, index) => (
                            <Table.Row key={index}>
                                {row.map((column, i) => (
                                    <Table.Cell key={i}>{column}</Table.Cell>
                                ))}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </StyledTableContainer>
        </>
    );
};
