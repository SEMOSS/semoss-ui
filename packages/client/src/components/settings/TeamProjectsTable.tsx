import { useEffect, useState, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import {
    styled,
    Button,
    Checkbox,
    Table,
    IconButton,
    Modal,
    Typography,
    Autocomplete,
    Card,
    Box,
    Chip,
    Avatar,
    Search,
    Stack,
    useNotification,
    RadioGroup,
    Icon,
} from '@semoss/ui';
import {
    Delete,
    ClearRounded,
    EditRounded,
    RemoveRedEyeRounded,
} from '@mui/icons-material';
import { AxiosResponse } from 'axios';

import { SETTINGS_ROLE } from './settings.types';
import { useRootStore } from '@/hooks';

const colors = [
    '#22A4FF',
    '#FA3F20',
    '#FA3F20',
    '#FF9800',
    '#FF9800',
    '#22A4FF',
    '#4CAF50',
];

const UserInfoTableCell = styled(Table.Cell)({
    display: 'flex',
    alignItems: 'center',
    height: '84px',
});

const NameIDWrapper = styled('div')({
    display: 'inline-block',
});

const StyledProjectContent = styled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '25px',
    flexShrink: '0',
});

const StyledProjectInnerContent = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    alignSelf: 'stretch',
});

const StyledTableContainer = styled(Table.Container)({
    borderRadius: '12px',
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledProjectTable = styled(Table)({ backgroundColor: 'white' });

const StyledTableTitleContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
    backgroundColor: 'white',
});

const StyledTableTitleDiv = styled('div')({
    display: 'flex',
    padding: '12px 24px 12px 16px',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleProjectContainer = styled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledTableTitleProjectCountContainer = styled('div')({
    display: 'flex',
    height: '56px',
    padding: '6px 16px 6px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleProjectCount = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSearchButtonContainer = styled('div')({
    display: 'flex',
    alignItems: 'center',
    // gap: '10px',
});

const StyledDeleteSelectedContainer = styled('div')({
    display: 'flex',
    padding: '10px 8px 10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledAddProjectsContainer = styled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledNonProjectsContainer = styled('div')({
    width: '100%',
    borderRadius: '12px',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledNonProjectsDiv = styled('div')({
    width: '100%',
    height: '503px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    justifyContent: 'center',
    alignItems: 'center',
});

const StyledTableCell = styled(Table.Cell)({
    paddingLeft: '16px',
});

const StyledCheckbox = styled(Checkbox)({
    paddingBottom: '0px',
});

const StyledModalContentText = styled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
    marginTop: '12px',
});

const StyledCard = styled(Card)({
    borderRadius: '12px',
});

// maps for permissions,
const permissionMapper = {
    Author: 1, // BE: 'DISPLAY'
    Editor: 2, // BE: 'DISPLAY'
    'Read-Only': 3, // DISPLAY: BE
};

interface ProjectsTableProps {
    /**
     * Id of the setting
     */
    groupId: string;

    /**
     * group type
     */
    groupType: string;

    name: string;
}

export const TeamProjectsTable = (props: ProjectsTableProps) => {
    const { groupId, groupType } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    /** Project Table State */
    const [projectsPage, setProjectsPage] = useState<number>(1);
    const [selectedProjects, setSelectedProojects] = useState([]);
    const [count, setCount] = useState(0);

    /** Delete Project */
    const [deleteProjectsModal, setDeleteProjectsModal] =
        useState<boolean>(false);
    const [deleteProjectModal, setDeleteProjectModal] =
        useState<boolean>(false);
    const [projectToDelete, setProjectToDelete] = useState(null);

    /** Add Project State */
    const [addProjectModal, setAddProjectModal] = useState<boolean>(false);
    const [nonCredentialedProjects, setNonCredentialedProjects] = useState([]);
    const [
        selectedNonCredentialedProjects,
        setSelectedNonCredentialedProjects,
    ] = useState([]);
    const [addProjectRole, setAddProjectRole] = useState<SETTINGS_ROLE>();

    const [projects, setProjects] = useState(null);
    const [projectCount, setProjectCount] = useState(null);
    const [hasProjects, setHasProject] = useState(false);

    const limit = 5;

    const projectSearchRef = useRef(undefined);

    const { watch, setValue } = useForm<{
        SEARCH_FILTER: string;
    }>({
        defaultValues: {
            // Filters for projects table
            SEARCH_FILTER: '',
        },
    });

    const searchFilter = watch('SEARCH_FILTER');

    /**
     * @name useEffect
     * @desc - sets projects in react hook form
     */
    useEffect(() => {
        monolithStore
            .getTeamProjects(
                groupId,
                limit,
                projectsPage * limit - limit, // offset
                searchFilter,
                false,
            )
            .then((data) => {
                setProjects(data);
                setHasProject(true);
            });
    }, []);

    /**
     * @name submitNonGroupProjects
     */
    const submitNonGroupProjects = async () => {
        try {
            // construct requests for post data
            const requests = selectedNonCredentialedProjects.map((m) => {
                return {
                    project_id: m.project_id,
                    permission: permissionMapper[addProjectRole],
                };
            });

            if (requests.length === 0) {
                notification.add({
                    color: 'warning',
                    message: `No projects to add`,
                });

                return;
            }

            for (let i = 0; i < requests.length; i++) {
                let response: AxiosResponse<{ success: boolean }> | null = null;
                response = await monolithStore.addProject(
                    groupId,
                    requests[i].project_id,
                    permissionMapper[addProjectRole],
                    groupType ? groupType : '',
                );

                if (!response) {
                    return;
                }

                // ignore if there is no response
                if (response) {
                    setAddProjectModal(false);
                    setSelectedNonCredentialedProjects([]);

                    notification.add({
                        color: 'success',
                        message: 'Successfully added project permission',
                    });
                } else {
                    notification.add({
                        color: 'error',
                        message: `Error adding project permission`,
                    });
                }
            }
        } catch (e) {
            setAddProjectModal(false);
            setSelectedNonCredentialedProjects([]);

            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the projects
            setCount(count + 1);
        }
    };

    /**
     * @name deleteProject
     * @param project
     */
    const deleteProject = async (project) => {
        try {
            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.deleteProjectPermission(
                groupId,
                project,
            );

            if (!response) {
                return;
            }

            notification.add({
                color: 'success',
                message: `Successfully removed project`,
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setDeleteProjectModal(false);
            setCount(count + 1);
        }
        // refresh the projects
    };

    /**
     * @name deleteProjectPermissions
     */
    const deleteProjectPermissions = async () => {
        try {
            for (let i = 0; i < selectedProjects.length; i++) {
                try {
                    let response: AxiosResponse<{ success: boolean }> | null =
                        null;
                    response = await monolithStore.deleteProjectPermission(
                        groupId,
                        selectedProjects[i],
                    );

                    if (!response) {
                        return;
                    }
                } catch (e) {
                    notification.add({
                        color: 'error',
                        message: String(e),
                    });
                } finally {
                    setDeleteProjectModal(false);
                }
            }
        } finally {
            notification.add({
                color: 'success',
                message: `Successfully removed projects`,
            });
            setCount(count + 1);
            setDeleteProjectsModal(false);
            setSelectedProojects([]);
        }
    };

    /**
     * @name getProjects
     * @desc Gets all projects without credentials
     */
    const getProjects = async () => {
        try {
            let response;
            // possibly add more db table columns / keys here to get id type for display under projects
            // eslint-disable-next-line prefer-const
            response = await monolithStore.getUnassignedTeamProjects(groupId);

            // ignore if there is no response
            if (response) {
                const projects = response.map((val) => {
                    return {
                        ...val,
                        color: colors[
                            Math.floor(Math.random() * colors.length)
                        ],
                    };
                });

                setNonCredentialedProjects(projects);
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            setAddProjectModal(true);
        }
    };

    /** MEMBER TABLE FUNCTIONS */
    const updateSelectedProjects = async (project) => {
        try {
            if (!project.projectid) {
                notification.add({
                    color: 'warning',
                    message: `No permissions to change`,
                });

                return;
            }

            let response: AxiosResponse<{ success: boolean }> | null = null;
            response = await monolithStore.editProjectPermisison(
                groupId,
                project,
            );

            if (!response) {
                return;
            }

            // ignore if there is no response

            if (response.data) {
                notification.add({
                    color: 'success',
                    message: 'Succesfully updated permissions',
                });
            } else {
                notification.add({
                    color: 'error',
                    message: `Error changing permissions`,
                });
            }
        } catch (e) {
            notification.add({
                color: 'error',
                message: String(e),
            });
        } finally {
            // refresh the members
            // getMembers.refresh();
        }
    };

    const paginationOptions = {
        projectsPageCounts: [5],
    };

    projects > 9 && paginationOptions.projectsPageCounts.push(10);
    projects > 19 && paginationOptions.projectsPageCounts.push(20);

    function useDebounce(effect, dependencies, delay) {
        const callback = useCallback(effect, dependencies);

        useEffect(() => {
            const timeout = setTimeout(callback, delay);
            return () => clearTimeout(timeout);
        }, [callback, delay]);
    }

    // DeBounce Function
    useDebounce(
        () => {
            monolithStore
                .getTeamProjects(
                    groupId,
                    limit,
                    projectsPage * limit - limit, // offset
                    searchFilter,
                    false,
                )
                .then((data) => {
                    setProjects(data);
                    setHasProject(true);
                });
            monolithStore
                .getTeamProjects(
                    groupId,
                    100,
                    0, // offset
                    searchFilter,
                    false,
                )
                .then((data) => setProjectCount(data.length));
        },
        [count, projectsPage, searchFilter],
        200,
    );

    return (
        <StyledProjectContent>
            <StyledProjectInnerContent>
                {(projects && projects.length > 0) ||
                projectCount > 0 ||
                hasProjects ? (
                    <StyledTableContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>Projects</StyledTableTitleDiv>
                            <StyledTableTitleProjectContainer />
                            <StyledSearchButtonContainer>
                                <Search
                                    ref={projectSearchRef}
                                    placeholder="Search Projects"
                                    size="small"
                                    value={searchFilter}
                                    onChange={(e) => {
                                        setValue(
                                            'SEARCH_FILTER',
                                            e.target.value,
                                        );
                                    }}
                                />
                            </StyledSearchButtonContainer>

                            <StyledDeleteSelectedContainer>
                                {selectedProjects.length > 0 && (
                                    <Button
                                        variant={'outlined'}
                                        color="error"
                                        onClick={() =>
                                            setDeleteProjectsModal(true)
                                        }
                                    >
                                        Delete Selected
                                    </Button>
                                )}
                            </StyledDeleteSelectedContainer>
                            <StyledAddProjectsContainer>
                                <Button
                                    variant={'contained'}
                                    onClick={() => {
                                        getProjects();
                                    }}
                                >
                                    Add Projects{' '}
                                </Button>
                            </StyledAddProjectsContainer>
                        </StyledTableTitleContainer>
                        <StyledProjectTable>
                            <Table.Head>
                                <Table.Row>
                                    <Table.Cell size="small" padding="checkbox">
                                        <Checkbox
                                            checked={
                                                selectedProjects.length ===
                                                    projects.length &&
                                                projects.length > 0
                                            }
                                            onChange={() => {
                                                if (
                                                    selectedProjects.length !==
                                                    projects.length
                                                ) {
                                                    setSelectedProojects(
                                                        projects,
                                                    );
                                                } else {
                                                    setSelectedProojects([]);
                                                }
                                            }}
                                        />
                                    </Table.Cell>
                                    <Table.Cell size="small">Name</Table.Cell>
                                    <Table.Cell size="small">Access</Table.Cell>
                                    <Table.Cell size="small">
                                        Added Date
                                    </Table.Cell>
                                    <Table.Cell size="small">Action</Table.Cell>
                                </Table.Row>
                            </Table.Head>
                            <Table.Body>
                                {projects &&
                                    projects.map((x, i) => {
                                        const project = projects[i];

                                        let isSelected = false;

                                        if (project) {
                                            isSelected = selectedProjects.some(
                                                (value) => {
                                                    return (
                                                        value.projectid ===
                                                        project.projectid
                                                    );
                                                },
                                            );
                                        }
                                        if (project) {
                                            return (
                                                <Table.Row
                                                    key={project.projectid + i}
                                                >
                                                    <StyledTableCell
                                                        size="medium"
                                                        padding="checkbox"
                                                    >
                                                        <StyledCheckbox
                                                            checked={isSelected}
                                                            onChange={() => {
                                                                if (
                                                                    isSelected
                                                                ) {
                                                                    const selProjects =
                                                                        [];
                                                                    selectedProjects.forEach(
                                                                        (p) => {
                                                                            if (
                                                                                p.projectid !==
                                                                                project.projectid
                                                                            )
                                                                                selProjects.push(
                                                                                    p,
                                                                                );
                                                                        },
                                                                    );
                                                                    setSelectedProojects(
                                                                        selProjects,
                                                                    );
                                                                } else {
                                                                    setSelectedProojects(
                                                                        [
                                                                            ...selectedProjects,
                                                                            project,
                                                                        ],
                                                                    );
                                                                }
                                                            }}
                                                        />
                                                    </StyledTableCell>
                                                    <UserInfoTableCell
                                                        size="medium"
                                                        component="td"
                                                        scope="row"
                                                    >
                                                        <NameIDWrapper>
                                                            <Stack>
                                                                {
                                                                    project.project_name
                                                                }
                                                            </Stack>
                                                            <Stack>
                                                                {`Project ID: ${project.projectid}`}
                                                            </Stack>
                                                        </NameIDWrapper>
                                                    </UserInfoTableCell>
                                                    <Table.Cell size="medium">
                                                        <RadioGroup
                                                            row
                                                            defaultValue={
                                                                project.permission
                                                            }
                                                            onChange={(e) => {
                                                                console.log(
                                                                    'Hit Update Permission fn and fix in state',
                                                                );
                                                                updateSelectedProjects(
                                                                    {
                                                                        projectid:
                                                                            project.projectid,
                                                                        type: project.type,
                                                                        permission:
                                                                            e
                                                                                .target
                                                                                .value,
                                                                    },
                                                                );
                                                            }}
                                                        >
                                                            <RadioGroup.Item
                                                                value="1"
                                                                label="Author"
                                                            />
                                                            <RadioGroup.Item
                                                                value="2"
                                                                label="Editor"
                                                            />
                                                            <RadioGroup.Item
                                                                value="3"
                                                                label="Read-Only"
                                                            />
                                                        </RadioGroup>
                                                    </Table.Cell>
                                                    <Table.Cell size="medium">
                                                        {
                                                            project.project_date_created
                                                        }
                                                    </Table.Cell>
                                                    <Table.Cell size="medium">
                                                        <IconButton
                                                            onClick={() => {
                                                                // set project
                                                                setProjectToDelete(
                                                                    project,
                                                                );
                                                                // open modal
                                                                setDeleteProjectModal(
                                                                    true,
                                                                );
                                                            }}
                                                        >
                                                            <Delete></Delete>
                                                        </IconButton>
                                                    </Table.Cell>
                                                </Table.Row>
                                            );
                                        } else {
                                            return (
                                                <Table.Row
                                                    key={
                                                        i + 'No data available'
                                                    }
                                                >
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                    <Table.Cell size="medium"></Table.Cell>
                                                </Table.Row>
                                            );
                                        }
                                    })}
                            </Table.Body>
                            <Table.Footer>
                                <Table.Row>
                                    <Table.Pagination
                                        rowsPerPageOptions={
                                            paginationOptions.projectsPageCounts
                                        }
                                        onPageChange={(e, v) => {
                                            setProjectsPage(v + 1);
                                            setSelectedProojects([]);
                                        }}
                                        page={projectsPage - 1}
                                        rowsPerPage={5}
                                        count={projectCount}
                                    />
                                </Table.Row>
                            </Table.Footer>
                        </StyledProjectTable>
                    </StyledTableContainer>
                ) : (
                    <StyledNonProjectsContainer>
                        <StyledTableTitleContainer>
                            <StyledTableTitleDiv>
                                <Typography variant={'h6'}>projects</Typography>
                            </StyledTableTitleDiv>
                        </StyledTableTitleContainer>
                        <StyledNonProjectsDiv>
                            <Typography variant={'body1'}>
                                No projects present
                            </Typography>
                            <Button
                                variant={'contained'}
                                onClick={() => {
                                    getProjects();
                                }}
                            >
                                Add Projects
                            </Button>
                        </StyledNonProjectsDiv>
                    </StyledNonProjectsContainer>
                )}
            </StyledProjectInnerContent>
            <Modal open={addProjectModal} maxWidth="lg">
                <Modal.Title>Add App</Modal.Title>
                <Modal.Content sx={{ width: '50rem' }}>
                    <StyledModalContentText>
                        <Autocomplete
                            label="Select App"
                            placeholder="App Name"
                            multiple={true}
                            options={nonCredentialedProjects}
                            limitTags={2}
                            getLimitTagsText={() =>
                                ` +${
                                    selectedNonCredentialedProjects.length - 2
                                }`
                            }
                            value={[...selectedNonCredentialedProjects]}
                            getOptionLabel={(option: any) => {
                                return `${option.project_name}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return (
                                    option.project_name === value.project_name
                                );
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedProjects([
                                    ...newValue,
                                ]);
                            }}
                        />

                        {selectedNonCredentialedProjects &&
                            selectedNonCredentialedProjects.map(
                                (project, idx) => {
                                    const space =
                                        project.project_name.indexOf(' ');
                                    const initial = project.project_name
                                        ? space > -1
                                            ? `${project.project_name[0].toUpperCase()}${project.project_name[
                                                  space + 1
                                              ].toUpperCase()}`
                                            : project.project_name[0].toUpperCase()
                                        : project.project_id[0].toUpperCase();
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
                                                        justifyContent:
                                                            'center',
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
                                                                project.color,
                                                        }}
                                                    >
                                                        {initial}
                                                    </Avatar>
                                                </Box>
                                            </Box>
                                            <Card.Header
                                                title={
                                                    <Typography variant="h5">
                                                        {project.project_name}
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
                                                                fontSize:
                                                                    '14px',
                                                            }}
                                                        >
                                                            {`Project ID: `}
                                                            <Chip
                                                                label={
                                                                    project.project_id
                                                                }
                                                                size="small"
                                                            />
                                                        </span>
                                                        {`• `}
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
                                                                selectedNonCredentialedProjects.filter(
                                                                    (val) =>
                                                                        val.project_id !==
                                                                        project.project_id,
                                                                );
                                                            setSelectedNonCredentialedProjects(
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
                                },
                            )}

                        <Typography
                            variant="subtitle1"
                            sx={{
                                pt: '12px',
                                pb: '12px',
                                fontWeight: 'bold',
                                fontSize: '16',
                            }}
                        >
                            Permissions
                        </Typography>
                        <Box
                            sx={{
                                backgroundColor: 'rgba(0,0,0,.03)',
                                padding: '10px',
                                borderRadius: '8px',
                            }}
                        >
                            <RadioGroup
                                label={''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        setAddProjectRole(val as SETTINGS_ROLE);
                                    }
                                }}
                            >
                                <Stack spacing={1}>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            backgroundColor:
                                                                'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        A
                                                    </Avatar>
                                                    Author
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to edit the model
                                                    connection details, set the
                                                    model as discoverable,
                                                    provision other authors, and
                                                    all editor abilities.
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Author"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Icon
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            color: 'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        <EditRounded />
                                                    </Icon>
                                                    Editor
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to edit the model
                                                    details, provision other
                                                    users as editors and read
                                                    only users, and all read
                                                    only abilities.
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Editor"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                    <StyledCard>
                                        <Card.Header
                                            title={
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        fontSize: '16px',
                                                    }}
                                                >
                                                    <Icon
                                                        sx={{
                                                            width: '20px',
                                                            height: '20px',
                                                            mt: '6px',
                                                            marginRight: '12px',
                                                            fontSize: '12px',
                                                            fontWeight: 'bold',
                                                            color: 'rgba(0, 0, 0, .5)',
                                                        }}
                                                    >
                                                        EditRounded,
                                                        RemoveRedEyeRounded
                                                        <RemoveRedEyeRounded />
                                                    </Icon>
                                                    Read-Only
                                                </Box>
                                            }
                                            sx={{ color: '#000' }}
                                            subheader={
                                                <Box
                                                    sx={{
                                                        marginLeft: '30px',
                                                    }}
                                                >
                                                    Ability to view model
                                                    details and usage
                                                    instructions
                                                </Box>
                                            }
                                            action={
                                                <RadioGroup.Item
                                                    value="Read-Only"
                                                    label=""
                                                />
                                            }
                                        />
                                    </StyledCard>
                                </Stack>
                            </RadioGroup>
                        </Box>
                    </StyledModalContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="outlined"
                        onClick={() => setAddProjectModal(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant={'contained'}
                        disabled={
                            !addProjectRole ||
                            selectedNonCredentialedProjects.length < 1
                        }
                        onClick={() => {
                            submitNonGroupProjects();
                        }}
                    >
                        Save
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteProjectModal} maxWidth="md">
                <Modal.Title>
                    <Typography variant="h6">Are you sure?</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>
                        {projectToDelete && (
                            <Typography variant="body1">
                                This will remove{' '}
                                <b>{projectToDelete.project_name}</b>
                            </Typography>
                        )}
                    </Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteProjectModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="error"
                        variant={'contained'}
                        onClick={() => {
                            if (!projectToDelete) {
                                console.error('No project to delete');
                            }
                            deleteProject(projectToDelete);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteProjectsModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected projects?
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteProjectsModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        color="error"
                        onClick={() => {
                            deleteProjectPermissions();
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledProjectContent>
    );
};
