import React from 'react';
import {
    Table,
    Button,
    Select,
    InputAdornment,
    Box,
    TextField,
    Avatar,
    Icon,
    IconButton,
    Typography,
    Modal,
    Autocomplete,
    Card,
    Chip,
    Link,
    styled,
} from '@semoss/ui';
import { Collapse } from '@mui/material';
import {
    Search,
    EditRounded,
    EastRounded,
    FilterAltRounded,
    Person2Rounded,
    ClearRounded,
    DeleteRounded,
} from '@mui/icons-material/';

import { useRootStore } from '@/hooks';

const StyledTableBox = styled(Box)({
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    marginBottom: '6rem',
});

const StyledTableHead = styled(Table.Head)({
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '1px solid rgba(224, 224, 224, 1)',
    backgroundColor: '#fff',
});

const headerCells = [
    {
        name: 'Name',
        key: 'NAME',
        render: (value) => value.NAME,
    },
    {
        name: 'Description',
        key: 'DESCRIPTION',
        render: (value) => value.DESCRIPTION,
    },
    {
        name: 'Date Created',
        key: 'DATE_CREATED',
        render: (value) => value.DATE_CREATED,
    },
    {
        name: 'Number of Members',
        key: 'NUMBER_OF_MEMBERS',
        render: (value) => value.NUMBER_OF_MEMBERS,
    },
    {
        name: 'Created By',
        key: 'CREATED_BY',
        render: (value) => value.CREATED_BY,
    },
    {
        name: 'Actions',
        key: 'ACTIONS',
        render: (value) => value.ACTIONS,
    },
];

const data = [
    {
        name: 'Team Name #1',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #2',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #3',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #4',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #5',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #6',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #7',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #8',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #9',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #10',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
    {
        name: 'Team Name #11',
        description: 'Team Description',
        date_created: '09-10-2024',
        number_of_members: '20',
        created_by: 'tzylks',
    },
];

interface ModalProps {
    open: boolean;
    setOpen: (e) => void;
    setSelectedNonCredentialedUsers: (e) => void;
    selectedNonCredentialedUsers:
        | { name: string; id: string; email: string; color: string }[]
        | undefined[];
    nonCredentialedUsers:
        | { name: string; id: string; email: string; color: string }[]
        | undefined[];
    setNonCredentialedUsers: (e) => void;
}

const AddTeamModal = (props: ModalProps) => {
    const {
        open,
        setOpen,
        selectedNonCredentialedUsers,
        setSelectedNonCredentialedUsers,
        nonCredentialedUsers,
    } = props;
    const [name, setName] = React.useState('');
    const [description, setDescription] = React.useState('');

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Modal open={open} maxWidth="md">
            <Modal.Title>Add Team</Modal.Title>
            <Modal.Content sx={{ width: '606px' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        mt: '8px',
                        gap: 2,
                    }}
                >
                    <TextField
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        label="Team Name"
                        fullWidth
                    />
                    <TextField
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        label="Team Description"
                        fullWidth
                    />
                    <Box sx={{ marginTop: '8px' }}>
                        <Typography
                            variant="h6"
                            sx={{
                                fontSize: '16px',
                                fontStyle: 'normal',
                                lineHeight: '175%' /* 28px */,
                                letterSpacing: '0.15px',
                            }}
                        >
                            Add Members
                        </Typography>
                        <Autocomplete
                            sx={{ pt: '12px' }}
                            label="Search"
                            multiple={true}
                            options={nonCredentialedUsers}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${selectedNonCredentialedUsers.length - 2}`
                            }
                            value={[...selectedNonCredentialedUsers]}
                            getOptionLabel={(option: any) => {
                                return `${option.name}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return option.name === value.name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedUsers([...newValue]);
                            }}
                        />

                        {selectedNonCredentialedUsers &&
                            selectedNonCredentialedUsers.map((user, idx) => {
                                const space = user.name.indexOf(' ');
                                const initial = user.name
                                    ? space > -1
                                        ? `${user.name[0].toUpperCase()}${user.name[
                                              space + 1
                                          ].toUpperCase()}`
                                        : user.name[0].toUpperCase()
                                    : user.id[0].toUpperCase();
                                return (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'left',
                                            align: 'center',
                                            backgroundColor:
                                                idx % 2 !== 0
                                                    ? 'rgba(0, 0, 0, .03)'
                                                    : '',
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                justifyContent: 'center',
                                                marginTop: '6px',
                                                marginLeft: '8px',
                                                marginRight: '8px',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    height: '80px',
                                                    width: '80px',
                                                    justifyContent: 'center',
                                                    alignItems: 'center',
                                                    border: '0.5px solid rgba(0, 0, 0, .05)',
                                                    borderRadius: '50%',
                                                }}
                                            >
                                                <Avatar
                                                    aria-label="avatar"
                                                    sx={{
                                                        display: 'flex',
                                                        width: '60px',
                                                        height: '60px',
                                                        fontSize: '24px',
                                                        backgroundColor:
                                                            user.color,
                                                    }}
                                                >
                                                    {initial}
                                                </Avatar>
                                            </Box>
                                        </Box>
                                        <Card.Header
                                            title={
                                                <Typography variant="h5">
                                                    {user.name}
                                                </Typography>
                                            }
                                            sx={{
                                                color: '#000',
                                                width: '100%',
                                            }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 2,
                                                        marginTop: '4px',
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            opacity: 0.9,
                                                            fontSize: '14px',
                                                        }}
                                                    >
                                                        {`User ID: `}
                                                        <Chip
                                                            label={user.id}
                                                            size="small"
                                                        />
                                                    </span>
                                                    {`• `}
                                                    <span>
                                                        {`Email: `}
                                                        <Link
                                                            href={`mailto:${user.email}`}
                                                            underline="none"
                                                        >
                                                            {user.email}
                                                        </Link>
                                                    </span>
                                                </Box>
                                            }
                                            action={
                                                <IconButton
                                                    sx={{
                                                        mt: '16px',
                                                        color: 'rgba( 0, 0, 0, .7)',
                                                        mr: '24px',
                                                    }}
                                                    onClick={() => {
                                                        const filtered =
                                                            selectedNonCredentialedUsers.filter(
                                                                (val) =>
                                                                    val.id !==
                                                                    user.id,
                                                            );
                                                        setSelectedNonCredentialedUsers(
                                                            filtered,
                                                        );
                                                    }}
                                                >
                                                    <ClearRounded />
                                                </IconButton>
                                            }
                                        />
                                    </Box>
                                );
                            })}
                    </Box>
                </Box>
            </Modal.Content>
            <Modal.Actions>
                <Button variant="outlined" onClick={handleClose}>
                    Cancel
                </Button>
                <Button variant="contained">Save</Button>
            </Modal.Actions>
        </Modal>
    );
};

export const TeamsPermissionsPage = () => {
    const [search, setSearch] = React.useState('');
    const [openSearch, setOpenSearch] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(0);
    const [rowsPerPage, setRowsPerPage] = React.useState(10);
    const [open, setOpen] = React.useState(false);
    const [nonCredentialedUsers, setNonCredentialedUsers] =
        React.useState<ModalProps>([]);
    const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
        React.useState<ModalProps>([]);

    const indexOfLastPost = (currentPage + 1) * rowsPerPage;
    const indexOfFirstPost = indexOfLastPost - rowsPerPage;
    const currentData = data
        .filter((val) => val.name.toLowerCase().includes(search.toLowerCase()))
        .slice(indexOfFirstPost, indexOfLastPost);

    const handleChangePage = (
        event: React.MouseEvent<HTMLButtonElement> | null,
        newPage: number,
    ) => {
        setCurrentPage(newPage);
    };

    const handleChangeRowsPerPage = (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setCurrentPage(0);
    };

    const { monolithStore, configStore } = useRootStore();
    const adminMode = configStore.store.user.admin;

    /**
     * @name mapMonolithFunction
     */
    const mapMonolithFunction = (
        workflow: 'database' | 'project' | 'insight',
        key: string,
    ) => {
        const API_MAP = {
            // key: Monolith Store Function Name
            // Pending Members Table
            databaseApproveUserRequest: 'approveDatabaseUserAccessRequest',
            projectApproveUserRequest: 'approveProjectUserAccessRequest',
            insightApproveUserRequest: 'approveInsightUserAccessRequest',

            databaseDenyUserRequest: 'denyDatabaseUserAccessRequest',
            projectDenyUserRequest: 'denyProjectUserAccessRequest',
            insightDenyUserRequest: 'denyInsightUserAccessRequest',

            // Members Table
            databaseGetNonCredUsers: 'getAppUsersNoCredentials',
            databaseAddMember: 'addDatabaseUserPermissions',
            databaseRemoveUserPermissions: 'removeDatabaseUserPermissions',
            databaseUpdatePermissions: 'editDatabaseUserPermissions',

            projectGetNonCredUsers: 'getProjectUsersNoCredentials',
            projectAddMember: 'addProjectUserPermissions',
            projectRemoveUserPermissions: 'removeProjectUserPermissions',
            projectUpdatePermissions: 'editProjectUserPermissions',

            insightGetNonCredUsers: 'getInsightUsersNoCredentials',
            insightAddMember: 'addInsightUserPermissions',
            insightRemoveUserPermissions: 'removeInsightUserPermissions',
            insightUpdatePermissions: 'editInsightUserPermissions',

            // Properties
            databaseSetGlobal: 'setDatabaseGlobal',
            databaseSetVisible: 'setDatabaseVisiblity',

            projectSetGlobal: 'setProjectGlobal',
            projectSetVisible: 'setProjectVisiblity',

            insightSetGlobal: 'setInsightGlobal',
        };

        const monolithFunctionKey = API_MAP[`${workflow}${key}`];

        return monolithFunctionKey;
    };

    const colors = [
        '#22A4FF',
        '#FA3F20',
        '#FA3F20',
        '#FF9800',
        '#FF9800',
        '#22A4FF',
        '#4CAF50',
    ];

    /** ADD MEMBER FUNCTIONS */
    /**
     * @name getUsersNoCreds
     * @desc Gets all users without credentials
     */
    const getUsersNoCreds = () => {
        monolithStore[mapMonolithFunction('database', 'GetNonCredUsers')](
            adminMode,
        )
            .then((response) => {
                const users = response.map((val) => {
                    val.color =
                        colors[Math.floor(Math.random() * colors.length)];
                    return val;
                });
                setNonCredentialedUsers(users);
                setOpen(true);
            })
            .catch((err) => {
                // throw error if promise doesn't fulfill
                throw Error(err);
            });
    };

    return (
        <>
            <StyledTableBox>
                <StyledTableHead>
                    <Box
                        sx={{
                            fontSize: '20px',
                            padding: '16px 24px 16px 16px',
                        }}
                    >
                        Teams
                    </Box>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 4,
                            padding: '10px 24px 10px 8px',
                        }}
                    >
                        {!openSearch ? (
                            <IconButton>
                                <Search
                                    onClick={() => setOpenSearch(!openSearch)}
                                />
                            </IconButton>
                        ) : (
                            <Collapse orientation="horizontal" in={openSearch}>
                                <TextField
                                    size="small"
                                    label="Search Team Names"
                                    value={search}
                                    onChange={(e) => {
                                        setCurrentPage(0);
                                        setSearch(e);
                                    }}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Collapse>
                        )}
                        <IconButton>
                            <FilterAltRounded />
                        </IconButton>
                        <Button
                            variant="contained"
                            sx={{
                                fontSize: '14px',
                                fontWeight: 500,
                                lineHeight: '24px' /* 171.429% */,
                                letterSpacing: '0.4px',
                                padding: '6px 16px',
                            }}
                            size="small"
                            onClick={() => getUsersNoCreds()}
                        >
                            + Add New
                        </Button>
                    </Box>
                </StyledTableHead>
                <Table>
                    <Table.Head>
                        {headerCells.map((cell, idx) => {
                            return (
                                <Table.Cell
                                    key={idx}
                                    sx={{
                                        fontSize: '14px',
                                        fontWeight: 'bold',
                                        lineHeight: '24px' /* 171.429% */,
                                        letterSpacing: '0.4px',
                                        alignItems: 'left',
                                    }}
                                >
                                    {typeof cell.name === 'string' && cell.name}
                                </Table.Cell>
                            );
                        })}
                    </Table.Head>
                    <Table.Body>
                        {currentData.map((val, idx) => {
                            return (
                                <Table.Row key={idx}>
                                    <Table.Cell
                                        sx={{ padding: '0px 0px 0px 16px' }}
                                    >
                                        {val.name}
                                    </Table.Cell>
                                    <Table.Cell
                                        sx={{ padding: '0px 0px 0px 16px' }}
                                    >
                                        {val.description}
                                    </Table.Cell>
                                    <Table.Cell
                                        sx={{ padding: '0px 0px 0px 16px' }}
                                    >
                                        {val.date_created}
                                    </Table.Cell>
                                    <Table.Cell
                                        sx={{ padding: '0px 0px 0px 16px' }}
                                    >
                                        {val.number_of_members}
                                    </Table.Cell>
                                    <Table.Cell
                                        sx={{ padding: '0px 0px 0px 16px' }}
                                    >
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                            }}
                                        >
                                            <Avatar>
                                                <Person2Rounded />
                                            </Avatar>
                                            {val.created_by}
                                        </Box>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                flexDirection: 'row',
                                                gap: 0.5,
                                                alignItems: 'left',
                                            }}
                                        >
                                            <IconButton
                                                sx={{
                                                    borderRadius: '7.5px',
                                                    border: '0.938px solid rgba(0, 0, 0, 0.10)',
                                                }}
                                            >
                                                <EditRounded color="primary" />
                                            </IconButton>
                                            <IconButton
                                                sx={{
                                                    borderRadius: '7.5px',
                                                    border: '0.938px solid rgba(0, 0, 0, 0.10)',
                                                }}
                                            >
                                                <DeleteRounded color="primary" />
                                            </IconButton>
                                            <IconButton
                                                sx={{
                                                    borderRadius: '7.5px',
                                                    border: '0.938px solid rgba(0, 0, 0, 0.10)',
                                                }}
                                            >
                                                <EastRounded color="primary" />
                                            </IconButton>
                                        </Box>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                    <Table.Pagination
                        count={
                            search
                                ? currentData.length >= 10
                                    ? currentData.length + 1
                                    : currentData.length
                                : data.length
                        }
                        page={currentPage}
                        onPageChange={handleChangePage}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                </Table>
            </StyledTableBox>
            <AddTeamModal
                open={open}
                setOpen={setOpen}
                nonCredentialedUsers={nonCredentialedUsers}
                setNonCredentialedUsers={setNonCredentialedUsers}
                selectedNonCredentialedUsers={selectedNonCredentialedUsers}
                setSelectedNonCredentialedUsers={
                    setSelectedNonCredentialedUsers
                }
            />
        </>
    );
};
