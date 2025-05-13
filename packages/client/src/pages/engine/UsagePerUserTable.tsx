import { useEngine, usePixel } from '@/hooks';
import {
    Table,
    Typography,
    styled,
    Search,
    IconButton,
    AvatarGroup,
    Avatar,
} from '@semoss/ui';
import { useState, useRef, useEffect, useMemo } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { FilterAltSharp } from '@mui/icons-material';

const StyledTableContainer = styled(Table.Container)({
    background: '#FFF',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const Grid = styled('div')({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
});
const StyledSearchFilter = styled('div')({
    marginLeft: '10px',
    display: 'flex',
});
const StyledFilter = styled('div')({
    marginLeft: '10px',
});
const StyledDiv = styled('div')({
    display: 'flex',
    justifyContent: 'left',
    alignItems: 'center',
    gap: '5px',
});

const MAPPINGS = {
    USER_NAME: 'User',
    USER_ID: 'UserId',
    'Total Tokens': 'Tokens',
    'Total Messages': 'Messages',
};

const HEADER_ORDER = ['USER_NAME', 'USER_ID', 'Total Messages', 'Total Tokens'];

export const UsagePerUserTable = () => {
    const [search, setSearch] = useState<string>('');
    const searchRef = useRef<HTMLInputElement | null>(null);
    const [page, setPage] = useState<number>(0);
    const [rowsPerPage, setRowsPerPage] = useState<number>(5);
    const [isSearch, setIsSearch] = useState<boolean>(false);
    const [isFilter, setIsFilter] = useState<boolean>(false);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        searchRef.current?.focus();
    }, [search]);

    const { id, type } = useEngine();
    const usagePerUserPixel = ['MODEL'].includes(type)
        ? `GetEngineUsagePerUser(engine='${id}');`
        : '';
    const usagePerUsers = usePixel(usagePerUserPixel);

    console.log(usagePerUsers);

    const outputData: Record<string, any>[] =
        usagePerUsers.status === 'SUCCESS' && Array.isArray(usagePerUsers.data)
            ? usagePerUsers.data
            : [];

    const headers = HEADER_ORDER.filter(
        (header) => outputData.length > 0 && header in outputData[0],
    );
    const rows = outputData.length > 0 ? outputData : [];

    const getAvatarsForRow = (userName: string) => {
        return (userName || '')
            .split(' ')
            .slice(0, 1)
            .map((name, i) => (
                <Avatar key={i}>{name.charAt(0).toUpperCase()}</Avatar>
            ));
    };

    const filteredRows = rows
        .filter((row) =>
            Object.values(row).some((value) =>
                value?.toString().toLowerCase().includes(search.toLowerCase()),
            ),
        )
        .sort((a, b) =>
            sortColumn
                ? sortOrder === 'asc'
                    ? a[sortColumn]
                          ?.toString()
                          .localeCompare(b[sortColumn]?.toString())
                    : b[sortColumn]
                          ?.toString()
                          .localeCompare(a[sortColumn]?.toString())
                : 0,
        );
    const paginatedRows = filteredRows.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage,
    );

    return (
        <>
            <Grid>
                <div>
                    <Typography variant={'h6'}>User Access</Typography>
                    <Typography variant={'body2'}>
                        Detailed view of user activity, including messages,
                        tokens, and last utilization date.
                    </Typography>
                </div>
                <StyledSearchFilter>
                    <StyledFilter>
                        {isSearch ? (
                            <Search
                                autoFocus={true}
                                inputRef={searchRef}
                                placeholder="Search"
                                size="small"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(0);
                                }}
                            />
                        ) : (
                            <IconButton onClick={() => setIsSearch(!isSearch)}>
                                <SearchIcon />
                            </IconButton>
                        )}
                    </StyledFilter>
                    <StyledFilter>
                        <IconButton
                            onClick={() => {
                                setIsFilter(!isFilter);
                                setSortColumn(isFilter ? null : 'USER_NAME');
                                setSortOrder(isFilter ? 'asc' : 'asc');
                            }}
                        >
                            <FilterAltSharp />
                        </IconButton>
                    </StyledFilter>
                </StyledSearchFilter>
            </Grid>
            <StyledTableContainer>
                <Table>
                    <Table.Head>
                        <Table.Row>
                            {headers.map((header, index) => (
                                <Table.Cell key={index}>
                                    {MAPPINGS[header]}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                    </Table.Head>
                    <Table.Body>
                        {paginatedRows.length > 0 ? (
                            paginatedRows.map((row, rowIndex) => (
                                <Table.Row key={rowIndex}>
                                    {headers.map((header, colIndex) => (
                                        <Table.Cell key={colIndex}>
                                            {header === 'USER_NAME' ? (
                                                <StyledDiv>
                                                    <AvatarGroup
                                                        spacing="small"
                                                        variant="circular"
                                                        max={4}
                                                    >
                                                        {getAvatarsForRow(
                                                            row['USER_NAME'],
                                                        )}
                                                    </AvatarGroup>
                                                    <Typography variant="body2">
                                                        {row['USER_NAME']}
                                                    </Typography>
                                                </StyledDiv>
                                            ) : (
                                                row[header]
                                            )}
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
