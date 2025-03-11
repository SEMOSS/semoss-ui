import { useEngine, usePixel } from '@/hooks';
import { Table, Typography, styled, Search } from '@semoss/ui';
import { useState, useRef, useEffect } from 'react';

export const UsagePerUserTable = () => {
    const [search, setSearch] = useState<string>('');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);

    useEffect(() => {
        searchRef.current?.focus();
    }, [search]);

    const { id, type } = useEngine();
    const usagePerUserPixel = ['MODEL'].includes(type)
        ? `GetEngineUsagePerUser(engine='${id}');`
        : '';
    const usagePerUsers = usePixel(usagePerUserPixel);
    console.log(usagePerUsers, 'usagePerUser');

    const outputData: Record<string, any>[] =
        usagePerUsers.status === 'SUCCESS' && Array.isArray(usagePerUsers.data)
            ? usagePerUsers.data
            : [];

    const headers = outputData.length > 0 ? Object.keys(outputData[0]) : [];
    const rows = outputData.length > 0 ? outputData : [];

    const filteredRows = rows.filter((row) =>
        Object.values(row).some((value) =>
            value?.toString().toLowerCase().includes(search.toLowerCase()),
        ),
    );
    const paginatedRows = filteredRows.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    const StyledTableContainer = styled(Table.Container)({
        borderRadius: '12px',
        background: '#FFF',
        boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    });

    const Grid = styled('div')({
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    });

    return (
        <>
            <Grid>
                <Typography variant={'h6'}>Usage Per User</Typography>
                <Search
                    inputRef={searchRef}
                    placeholder="Search"
                    size="small"
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(0);
                    }}
                />
            </Grid>

            <StyledTableContainer>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            {headers.map((header, index) => (
                                <Table.Cell key={index}>{header}</Table.Cell>
                            ))}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row, rowIndex) => (
                                <Table.Row key={rowIndex}>
                                    {headers.map((header, colIndex) => (
                                        <Table.Cell key={colIndex}>
                                            {row[header]}
                                        </Table.Cell>
                                    ))}
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                                <Table.Cell
                                    colSpan={headers.length}
                                    align="center"
                                >
                                    No filtered data found
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.Pagination
                                page={page}
                                rowsPerPage={rowsPerPage}
                                onPageChange={(_, newPage) => setPage(newPage)}
                                rowsPerPageOptions={[5, 10, 20]}
                                onRowsPerPageChange={(e) => {
                                    setRowsPerPage(
                                        parseInt(e.target.value, 10),
                                    );
                                    setPage(0);
                                }}
                                count={filteredRows.length}
                            />
                        </Table.Row>
                    </Table.Footer>
                </Table>
            </StyledTableContainer>
        </>
    );
};
