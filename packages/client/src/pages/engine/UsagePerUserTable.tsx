import { Table, Typography, styled } from '@semoss/ui';

const UsagePerUser = {
    value: {
        headers: [
            'Total Tokens',
            'Number of Rooms',
            'USER_ID',
            'USER_NAME',
            'Total Messages',
        ],
        values: [[1500, 4, 'parthpatel3', 'Parth Patel', 4]],
    },
};
const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    background: '#FFF',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

export const UsagePerUserTable = () => {
    return (
        <>
            <Typography variant={'h6'}>Usage Per User</Typography>
            <StyledTableContainer>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            {UsagePerUser.value.headers.map((header, index) => (
                                <Table.Cell key={index}>{header}</Table.Cell>
                            ))}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {UsagePerUser.value.values.map((row, index) => (
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
