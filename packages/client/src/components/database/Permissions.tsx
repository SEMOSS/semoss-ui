import React, {
    useEffect,
    useMemo,
    useState,
    useRef,
    SyntheticEvent,
} from 'react';
import { Navigate, useResolvedPath, useNavigate } from 'react-router-dom';
import { useForm, Controller, useFieldArray } from 'react-hook-form';

import { useRootStore, useSettings, usePixel, useAPI } from '@/hooks';

import {
    Form,
    // Button,
    Icon,
    Checkbox,
    Radio,
    Grid,
    Table,
    Select,
    Switch,
    Popover,
    // Modal,
    styled,
    theme,
    useNotification,
    Pagination,
} from '@semoss/components';

import {
    ButtonGroup,
    Button,
    Checkbox as MuiCheckbox,
    Table as MuiTable,
    styled as MuiStyled,
    IconButton,
    ToggleTabsGroup,
    AvatarGroup,
    Avatar,
    Modal,
    RadioGroup,
    Typography,
    Autocomplete,
} from '@semoss/ui';

import {
    Check,
    Close,
    Delete,
    FilterAltRounded,
    SearchOutlined,
} from '@mui/icons-material';

import { LoadingScreen } from '@/components/ui';
import { Card } from '@/components/ui';
import { Field } from '@/components/form';

const StyledContent = MuiStyled('div')({
    display: 'flex',
    width: '100%',
    // height: '992px',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px',
    flexShrink: '0',
    // border: 'solid red',
});

const StyledButtonGroup = MuiStyled(ButtonGroup)(({ theme }) => ({}));

const StyledMemberContent = MuiStyled('div')({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '25px',
    flexShrink: '0',
});

const StyledMemberInnerContent = MuiStyled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '20px',
    alignSelf: 'stretch',
});

const StyledTableContainer = MuiStyled(MuiTable.Container)({
    borderRadius: '12px',
    // background: #FFF;
    /* Devias Drop Shadow */
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledMemberTable = MuiStyled(MuiTable)({
    // display: 'flex',
    // flexDirection: 'column',
    // alignItems: 'flex-start',
    // width: '100%',
});

const StyledTableTitleContainer = MuiStyled('div')({
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    boxShadow: '0px -1px 0px 0px rgba(0, 0, 0, 0.12) inset',
});

const StyledTableTitleDiv = MuiStyled('div')({
    display: 'flex',
    padding: '12px 24px 12px 16px',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberContainer = MuiStyled('div')({
    display: 'flex',
    alignItems: 'flex-start',
    flex: '1 0 0',
});

const StyledAvatarGroupContainer = MuiStyled('div')({
    display: 'flex',
    width: '130px',
    height: '56px',
    padding: '10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberCountContainer = MuiStyled('div')({
    display: 'flex',
    height: '56px',
    padding: '6px 16px 6px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledTableTitleMemberCount = MuiStyled('div')({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledSearchButtonContainer = MuiStyled('div')({
    display: 'flex',
    padding: '5px 8px',
    alignItems: 'center',
    gap: '10px',
});

const StyledFilterButtonContainer = MuiStyled('div')({
    display: 'flex',
    padding: '5px 8px',
    alignItems: 'center',
    gap: '10px',
});

const StyledDeleteSelectedContainer = MuiStyled('div')({
    display: 'flex',
    padding: '10px 8px 10px 16px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

const StyledAddMemberContainer = MuiStyled('div')({
    display: 'flex',
    padding: '10px 24px 10px 8px',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
});

// Old styles
const StyledSelectedApp = styled('div', {
    marginTop: theme.space[4],
});

const StyledSettings = styled('div', {
    marginBottom: theme.space[4],
});

const StyledCardHeader = styled(Card.Header, {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: theme.space['2'],
    paddingBottom: theme.space['0'],
});

const StyledLeft = styled('div', {
    display: 'flex',
    alignItems: 'center',
});

const StyledRight = styled('div', {
    display: 'flex',
    alignItems: 'center',
});

const StyledCardContent = styled(Card.Content, {
    fontSize: theme.fontSizes.sm,
    minHeight: '5rem',
});

const StyledTableCont = styled('div', {
    borderRadius: theme.radii.default,
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
    backgroundColor: theme.colors.base,
    marginBottom: theme.space['8'],
    height: 'fit-content',
});

const StyledTableFooter = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    borderTopWidth: theme.borderWidths.default,
    borderTopColor: theme.colors['grey-4'],
    // height: '30rem',
});

const StyledTableFooterDiv = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    width: '30%',
    padding: theme.space['2'],
    fontWeight: theme.fontWeights.light,
});

const StyledTableFooterCenterDiv = styled('div', {
    width: '40%',
    display: 'flex',
    justifyContent: 'center',
    fontSize: theme.fontSizes.xs,
});

// const StyledModalFooter = styled(Modal.Footer, {
//     display: 'flex',
//     justifyContent: 'center',
// });

const StyledHeader = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottomWidth: theme.borderWidths.default,
    borderBottomColor: theme.colors['grey-4'],
});

const StyledHeaderLeft = styled('div', {
    display: 'flex',
    width: '30%',
    padding: theme.space[2],
    gap: '0.5rem',
});

const StyledHeaderRight = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    width: '70%',
    padding: theme.space[2],
    gap: '0.5rem',
});

const StyledHeaderIcon = styled(Icon, {
    height: '2rem',
    width: '2rem',
    marginRight: '.5rem',
    display: 'flex',
    alignItems: 'center',
});

const StyledFilter = styled('div', {
    display: 'flex',
    gap: '.5rem',
    width: '50%',
});

const StyledTableLabel = styled('h1', {
    fontSize: theme.fontSizes.md,
    color: theme.colors['grey-1'],
    fontWeight: theme.fontWeights.semibold,
});

const StyledMessageRow = styled('div', {
    display: 'flex',
    padding: theme.space[2],
    alignItems: 'center',
    justifyContent: 'center',
    gap: '.5rem',
    fontSize: theme.fontSizes.sm,

    variants: {
        warning: {
            true: {
                backgroundColor: theme.colors['warning-5'],
            },
            false: {},
        },
    },
});

const StyledTableBody = styled(Table.Body, {
    // height: '10rem',
    // minHeight: '10rem',
    // background: 'red',
});

const StyledTableRow = styled(Table.Row, {
    // display: 'flex',
    // flexDirection: 'row',
    // alignItems: 'center',
});

const StyledCell = styled(Table.Cell, {
    height: '3rem',
    minHeight: '3rem',
    // border: 'solid blue',
});

const StyledSmallCell = styled(StyledCell, {
    width: '10%',
});

const StyledProfileCell = styled(StyledCell, {
    width: '20%',
});

const StyledAdditionalInfoCell = styled(StyledCell, {
    width: '20%',
});

const StyledCellContent = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
    height: '2rem',
    minHeight: '2rem',
});

const StyledCellContentQuickActions = styled(StyledCellContent, {
    justifyContent: 'center',
});

const StyledRadio = styled(Radio, {
    width: '100%',
});

const StyledRowNum = styled('div', {
    width: '2rem',
    textOverflow: 'ellipsis',
});

const StyledField = styled('div', {
    marginBottom: theme.space['4'],
});

const StyledFlex = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: '.5rem',
});

const StyledFlexBetween = styled('div', {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: theme.space['1'],
    fontSize: theme.fontSizes.sm,
    // border: 'solid',
});

const StyledFlexEnd = styled('div', {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: theme.space['1'],
    fontSize: theme.fontSizes.sm,
});

const StyledMembersDiv = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['4'],
});

const StyledAvatar = styled('img', {
    verticalAlign: 'middle',
    borderRadius: '50%',

    '@sm': {
        width: '1rem',
        height: '1rem',
    },
    '@md': {
        width: '1rem',
        height: '1rem',
    },
    '@lg': {
        width: '1rem',
        height: '1rem',
    },
    '@xl': {
        width: '2rem',
        height: '2rem',
    },
    '@xxl': {
        width: '3rem',
        height: '3rem',
    },
});

const StyledAvatarsDiv = styled('div', {
    display: 'flex',
    listStyleType: 'none',
    flexDirection: 'row',
});

const StyledOverlappingImg = styled('img', {
    backgroundColor: '#596376',
    border: `2px solid ${theme.colors['base']}`,
    borderRadius: '100%',
    color: theme.colors['base'],
    display: 'block',
    fontWeight: theme.fontWeights.bold,
    textAlign: 'center',
    transition: 'margin 0.1s ease-in-out',
    marginLeft: '-15px',
    '&:first-child': {
        zIndex: '1',
        marginLeft: '0px',
    },
    '&:nth-child(2)': {
        zIndex: '2',
    },
    '&:nth-child(3)': {
        zIndex: '3',
    },
    '&:nth-child(4)': {
        zIndex: '4',
    },
    '&:nth-child(5)': {
        zIndex: '5',
    },

    '@sm': {
        width: '.2rem',
        height: '.2rem',
    },
    '@md': {
        width: '2rem',
        height: '2rem',
    },
    '@lg': {
        width: '2rem',
        height: '2rem',
    },
    '@xl': {
        width: '2rem',
        height: '2rem',
    },
    '@xxl': {
        width: '3rem',
        height: '3rem',
    },
});

const StyledOverlappingDiv = styled('div', {
    backgroundColor: theme.colors['primary-1'],
    border: `2px solid ${theme.colors['base']}`,
    borderRadius: '100%',
    color: theme.colors.base,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: theme.fontSizes['2'],
    textAlign: 'center',
    transition: 'margin 0.1s ease-in-out',
    marginLeft: '-15px',
    zIndex: '5',
    '@sm': {
        width: '.2rem',
        height: '.2rem',
    },
    '@md': {
        width: '2rem',
        height: '2rem',
    },
    '@lg': {
        width: '2rem',
        height: '2rem',
    },
    '@xl': {
        width: '2rem',
        height: '2rem',
    },
    '@xxl': {
        width: '3rem',
        height: '3rem',
    },
});

const StyledMembersCount = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['2'],
});

const FilterLabel = styled('div', {
    position: 'static',
    float: 'left',
    display: 'inline-block',
    padding: '0 8px 0 0',
    lineHeight: '32px',
    width: '190px',
});

// maps for permissions,
const permissionMapper = {
    1: 'Author', // BE: 'DISPLAY'
    OWNER: 'Author', // BE: 'DISPLAY'
    Author: 'OWNER', // DISPLAY: BE
    2: 'Editor', // BE: 'DISPLAY'
    EDIT: 'Editor', // BE: 'DISPLAY'
    Editor: 'EDIT', // DISPLAY: BE
    3: 'Read-Only', // BE: 'DISPLAY'
    READ_ONLY: 'Read-Only', // BE: 'DISPLAY'
    'Read-Only': 'READ_ONLY', // DISPLAY: BE
};

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

// Pending Members Table
interface PendingMember {
    ID: string;
    PERMISSION: string;
    REQUEST_TIMESTAMP: string;
    REQUEST_TYPE: string;
    REQUEST_USERID: string;
}

// Members Table
interface Member {
    id: string;
    name: string;
    EMAIL: string;
    SELECTED: boolean;
    permission: string;
    OG_PERMISSION?: string;
    CONFIRM_DELETE?: boolean;
}
interface PermissionConfig {
    id: string;
    name: string;
    global: boolean;
    visibility?: boolean;
    projectid?: string;
}

export interface PermissionsProps {
    config: PermissionConfig;
}

export const Permissions = (props: PermissionsProps) => {
    const { id, name, global, visibility, projectid } = props.config;

    const resolvedPathname = useResolvedPath('').pathname;

    // New Design State Items
    const [view, setView] = useState(0);
    // const [value, setValue] = useState(0);

    // End of new Design State Items

    // Helper hooks
    const { monolithStore } = useRootStore();
    const { adminMode } = useSettings();
    const notification = useNotification();
    const navigate = useNavigate();

    // scroll into view pending members
    const pendingTableRef = useRef(null);

    // used to get total members on first mount
    const didMount = useRef(false);

    const limit = 5;

    // Props we use for api fns to hit | "project, database, insight"
    const type: 'database' | 'project' | 'insight' | '' =
        resolvedPathname.includes('database-settings')
            ? 'database'
            : resolvedPathname.includes('project-permissions')
            ? 'project'
            : resolvedPathname.includes('insight-permissions')
            ? 'insight'
            : resolvedPathname.includes(`database/${id}`)
            ? 'database'
            : '';

    // if no api prop --> redirect
    if (!type) {
        return <Navigate to="/settings" replace />;
    }

    // apiString for getMembers useAPI Hook
    const getMembersString =
        type === 'database'
            ? 'getDatabaseUsers'
            : type === 'project'
            ? 'getProjectUsers'
            : type === 'insight' && 'getInsightUsers';

    // apiString for pendingUserAccess usePixel Hook
    const getPendingUsersString =
        type === 'database'
            ? `GetDatabaseUserAccessRequest(database='${id}');`
            : type === 'project'
            ? `GetProjectUserAccessRequest(project='${id}')`
            : type === 'insight' &&
              `GetInsightUserAccessRequest(project='${projectid}', id='${id}');`;

    // -- State

    // delete db, proj, insight modal
    const [deleteWorkflowModal, setDeleteWorkflowModal] = useState(false);

    //  Selected PENDING_MEMBERS
    const [selectedPendingMembers, setSelectedPendingMembers] = useState([]);
    // Select all checkbox -> Pending Members table
    const [selectAllPendingMembers, setSelectAllPendingMembers] =
        useState(false);
    const [pendingMembersIndeterminate, setPendingMembersIndeterminate] =
        useState(false);

    // Selected MEMBERS
    const [selectedMembers, setSelectedMembers] = useState([]);
    // Select all checkbox -> Members table
    const [selectAllMembers, setSelectAllMembers] = useState(false);
    const [indeterminate, setIndeterminate] = useState(false);

    // Select all total members for a workflow ( not just what's on the table's page  )
    const [totalMembers, setTotalMembers] = useState(false);

    // member to delete when clicking on Trashcan in table row
    const [userToDelete, setUserToDelete] = useState<Member | null>(null);

    // Members Modal
    const [addMembersModal, setAddMembersModal] = useState(false);
    const [deleteMembersModal, setDeleteMembersModal] = useState(false);
    const [updateMembersModal, setUpdateMembersModal] = useState(false);

    // individual member deletion
    const [deleteMemberModal, setDeleteMemberModal] = useState(false);

    // Pending Members Modal
    const [denySelectedModal, setDenySelectedModal] = useState(false);

    // Members count and Pagination
    const [membersCount, setMembersCount] = useState(0);
    const [filteredMembersCount, setFilteredMembersCount] = useState(0);
    const [membersPage, setMembersPage] = useState(1);

    const { control, watch, setValue } = useForm<{
        PENDING_MEMBERS: PendingMember[];
        MEMBERS: Member[];
        NON_CREDENTIALED_USERS: any[];
        SELECTED_NON_CREDENTIALED_USERS: any[];

        MEMBER_SEARCH_FILTER: string;
        MEMBER_ACCESS_FILTER: string;

        UPDATE_SELECTED_PERMISSION: string;
        ADD_MEMBER_PERMISSION: string;

        GLOBAL: boolean;
        VISIBILITY: boolean;
    }>({
        defaultValues: {
            // Pending Members Table
            PENDING_MEMBERS: [],
            // Members Table
            MEMBERS: [],
            SELECTED_NON_CREDENTIALED_USERS: [],
            NON_CREDENTIALED_USERS: [],

            // Filters for Members table
            MEMBER_SEARCH_FILTER: '',
            MEMBER_ACCESS_FILTER: '',

            // Members Table: Update Selected Modal
            UPDATE_SELECTED_PERMISSION: '',
            // Permission for Add Member modal
            ADD_MEMBER_PERMISSION: '',

            GLOBAL: false,
            VISIBILITY: false,
        },
    });

    const { remove: pendingMemberRemove } = useFieldArray({
        control,
        name: 'PENDING_MEMBERS',
    });

    const { remove: memberRemove } = useFieldArray({
        control,
        name: 'MEMBERS',
    });

    // various members from react hook form
    const pendingMembers = watch('PENDING_MEMBERS');
    const verifiedMembers = watch('MEMBERS');

    const nonCredentialedUsers = watch('NON_CREDENTIALED_USERS');
    const selectedNonCredentialedUsers = watch(
        'SELECTED_NON_CREDENTIALED_USERS',
    );

    // permission field in modals
    const updatedPermissionField = watch('UPDATE_SELECTED_PERMISSION');
    const addMemberPermissionField = watch('ADD_MEMBER_PERMISSION');

    // Filters on Members Table
    const searchFilter = watch('MEMBER_SEARCH_FILTER');
    const permissionFilter = watch('MEMBER_ACCESS_FILTER');

    // workflow attrs
    const visibilityField = watch('VISIBILITY');
    const globalField = watch('GLOBAL');

    if (!getMembersString) {
        return <Navigate to="/settings" replace />;
    }

    /**
     * @name useEffect
     * @desc - Clean up page and filters
     */
    useEffect(() => {
        setValue('GLOBAL', global);
        setValue('VISIBILITY', visibility);
        return () => {
            // clean up and reset
            setMembersPage(1);
            setValue('MEMBER_ACCESS_FILTER', '');
            setValue('MEMBER_SEARCH_FILTER', '');
            setValue('GLOBAL', false);
            setValue('VISIBILITY', false);
            didMount.current = false;
        };
    }, [id, projectid]);

    const deleteWorkflow = () => {
        let pixelString = '';
        if (type === 'database') {
            pixelString = `DeleteDatabase(database=['${id}']);`;
        } else {
            pixelString = `DeleteProject(project=['${id}']);`;
        }

        monolithStore.runQuery(pixelString).then((response) => {
            const type = response.pixelReturn[0].operationType;
            const output = response.pixelReturn[0].output;
            if (type.indexOf('ERROR') === -1) {
                notification.add({
                    color: 'success',
                    content: `Successfully deleted ${type}`,
                });

                // go back to settings
                navigate('/settings');
            } else {
                notification.add({
                    color: 'error',
                    content: output,
                });
                setDeleteWorkflowModal(false);
            }
        });
    };

    /**
     * @name changeVisibility
     */
    const changeVisibility = () => {
        monolithStore[mapMonolithFunction(type, 'SetVisible')](
            adminMode,
            id,
            !visibilityField,
        )
            .then((response) => {
                if (response.data) {
                    setValue('VISIBILITY', !visibilityField);

                    notification.add({
                        color: 'success',
                        content: 'Succesfully editted visibility.',
                    });
                }
            })
            .catch((error) => {
                notification.add({ color: 'error', content: error });
            });
    };

    /**
     * @name changeGlobal
     */
    const changeGlobal = () => {
        monolithStore[mapMonolithFunction(type, 'SetGlobal')](
            adminMode,
            id,
            !globalField,
            projectid,
        )
            .then((response) => {
                if (response.data.success) {
                    setValue('GLOBAL', !globalField);

                    notification.add({
                        color: 'success',
                        content: 'Succesfully editted global property.',
                    });
                }
            })
            .catch((error) => {
                notification.add({ color: 'error', content: error });
            });
    };

    /**
     * @name deleteSelectedMembers
     * @param members
     */
    const deleteSelectedMembers = (members: Member[]) => {
        const userArr = [];
        members.forEach((mem, i) => {
            userArr.push(mem.id);
        });

        monolithStore[mapMonolithFunction(type, 'RemoveUserPermissions')](
            adminMode,
            id,
            userArr,
            projectid,
        )
            .then((resp) => {
                // if (response.data?.success) {
                // if we delete everything on page we want to set the new page
                if (
                    verifiedMembers.length === userArr.length &&
                    membersPage !== 1 &&
                    membersPage !== filteredMembersCount / limit
                ) {
                    setMembersPage(membersPage - 1);
                }

                // get index of members in order to remove
                const indexesToRemove = [];
                userArr.forEach((mem) => {
                    verifiedMembers.find((m, i) => {
                        if (mem === m.id) indexesToRemove.push(i);
                    });
                });

                // remove indexes from react hook form
                memberRemove(indexesToRemove);

                const newMemberCount = membersCount - userArr.length;
                setMembersCount(newMemberCount);

                // Delete Selected Bulk
                if (!userToDelete) {
                    // clear selected members arr in state
                    setSelectedMembers([]);
                    // select all checkbox for db-members table
                    setSelectAllCheckboxState('members-table', []);
                } else {
                    // Quick Delete one member
                    const filteredSelectedMembers = selectedMembers.filter(
                        // find the single member that is being deleted and remove from selected members
                        (m) => m.id !== userToDelete.id,
                    );

                    // set new selected members
                    setSelectedMembers(filteredSelectedMembers);
                    // set select all checkbox state
                    setSelectAllCheckboxState(
                        'members-table',
                        filteredSelectedMembers,
                    );
                }

                notification.add({
                    color: 'success',
                    content: `Successfully removed ${
                        userArr.length > 1 ? 'members' : 'member'
                    } from ${type}`,
                });

                setDeleteMembersModal(false);

                getMembers.refresh();

                // }
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });

                setDeleteMembersModal(false);
            });
    };

    /**
     * @name updateSelectedUsers
     * @desc updates all selected users from verifiedMembers state
     * @desc Needs a clean up, BE has to fix what we pass them to
     * optimize this approach.
     */
    const updateSelectedUsers = (members, quickUpdate) => {
        // send to API
        const userArr = [];
        // Indexes to update through UI for MEMBERS field
        const indexesToUpdate = [];

        members.forEach((mem, i) => {
            indexesToUpdate.push(verifiedMembers.indexOf(mem));
            userArr.push({
                userid: mem.id,
                permission: quickUpdate
                    ? quickUpdate
                    : permissionMapper[updatedPermissionField],
            });
        });

        monolithStore[mapMonolithFunction(type, 'UpdatePermissions')](
            adminMode,
            id,
            userArr,
            projectid,
        )
            .then((resp) => {
                // try updating project permissions
                // update through ui rather than refreshing api call

                indexesToUpdate.forEach((i) => {
                    setValue(
                        `MEMBERS.${i}.permission`,
                        quickUpdate
                            ? quickUpdate
                            : permissionMapper[updatedPermissionField],
                    );
                });

                notification.add({
                    color: 'success',
                    content: quickUpdate
                        ? `${members[0].id} has been updated`
                        : 'All selected members have been updated',
                });

                if (quickUpdate) return;
                // clear selected members arr in state
                setSelectedMembers([]);
                // select all checkbox for db-members table
                setSelectAllCheckboxState('members-table', []);
                // reset modal field
                setValue('UPDATE_SELECTED_PERMISSION', '');
                // close modal
                setUpdateMembersModal(false);
            })
            .catch((error) => {
                notification.add({ color: 'error', content: error });
            });
    };

    /**
     * @name resetMembersFilters
     * @description filters on members table
     */
    const resetMembersFilters = () => {
        setValue('MEMBER_ACCESS_FILTER', '');
        setValue('MEMBER_SEARCH_FILTER', '');
    };

    // Helpers ---

    /**
     * @name showActionButtons
     * @desc helper to show whether we would like to show the
     * delete selected for both tables
     * @param table - which table to monitor selected members
     */
    const showActionButtons = (table: 'members-table' | 'pending-table') => {
        let showBtn = false;
        if (table === 'members-table') {
            if (selectedMembers.length > 0) {
                showBtn = true;
            }
        } else if (table === 'pending-table') {
            if (selectedPendingMembers.length > 0) {
                showBtn = true;
            }
        }
        return showBtn;
    };

    /**
     * @name isChecked
     * @param user - user in table
     * @param table - what table are we referring to
     * @returns boolean
     * @description - Takes a user, and determines whether they are in selected state
     */
    const isChecked = (
        table: 'members-table' | 'pending-table',
        user: Member | PendingMember,
    ): boolean => {
        // check if user is in selected arr
        if (table === 'members-table') return selectedMembers.includes(user);
        else if (table === 'pending-table')
            return selectedPendingMembers.includes(user);

        return false;
    };

    /**
     * @name filterCount
     * @desc used to return count of how many filters are being used
     */
    const filterCount = () => {
        let count = 0;
        if (permissionFilter) {
            count += 1;
        }
        return count;
    };

    /**
     * @name handleChange
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setView(newValue);
    };

    // Counts for pagination
    const paginationOptions = {
        membersPageCounts: [5],
    };

    membersCount > 9 && paginationOptions.membersPageCounts.push(10);
    membersCount > 19 && paginationOptions.membersPageCounts.push(20);

    return (
        <StyledContent>
            <ToggleTabsGroup
                value={view}
                onChange={handleChange}
                aria-label="basic tabs example"
            >
                <ToggleTabsGroup.Item label="Members" />
                <ToggleTabsGroup.Item label="Pending Requests" />
            </ToggleTabsGroup>

            {view === 0 && (
                <MembersTable
                    reactorPrefix={getMembersString}
                    type={type}
                    name={name}
                    adminMode={adminMode}
                    id={id}
                    projectId={projectid}
                />
            )}
            {view === 1 && (
                <PendingMembersTable
                    getPendingUsersString={getPendingUsersString}
                    type={type}
                    name={name}
                    adminMode={adminMode}
                    id={id}
                    projectId={projectid}
                />
            )}
        </StyledContent>

        // <StyledSelectedApp>
        //         <Form>
        //         <StyledButtonGroup variant={'contained'}>
        //             <Button
        //                 onClick={() => {
        //                     setView('members');
        //                 }}
        //             >
        //                 Members
        //             </Button>
        //             <Button
        //                 onClick={() => {
        //                     setView('pending requests');
        //                 }}
        //             >
        //                 Pending Requests
        //             </Button>
        //         </StyledButtonGroup>

        //         <StyledContent></StyledContent>

        //         {view === 'members' ? (
        //             <div>Active Members</div>
        //         ) : (
        //             <div>Pending Members</div>
        //         )}
        //         {/* <StyledSettings>
        //             <Grid>
        //                 {type !== 'insight' && !adminMode && (
        //                     <Grid.Item
        //                         responsive={{
        //                             sm: 12,
        //                             md: 6,
        //                             lg: 5,
        //                             xl: 4,
        //                         }}
        //                     >
        //                         <Card>
        //                             <StyledCardHeader>
        //                                 <StyledLeft>
        //                                     <StyledHeaderIcon
        //                                         path={
        //                                             visibilityField
        //                                                 ? mdiEye
        //                                                 : mdiEyeOff
        //                                         }
        //                                     ></StyledHeaderIcon>
        //                                     <div>Visibility</div>
        //                                 </StyledLeft>
        //                                 <StyledRight>
        //                                     <Switch
        //                                         title={`${
        //                                             visibilityField
        //                                                 ? 'Hide'
        //                                                 : 'Show'
        //                                         } ${type}`}
        //                                         value={visibilityField}
        //                                         onClick={() => {
        //                                             changeVisibility();
        //                                         }}
        //                                     ></Switch>
        //                                 </StyledRight>
        //                             </StyledCardHeader>
        //                             <StyledCardContent>
        //                                 Toggle whether the {type} is visible{' '}
        //                                 {type === 'database'
        //                                     ? 'in the data catalog.'
        //                                     : '.'}
        //                             </StyledCardContent>
        //                         </Card>
        //                     </Grid.Item>
        //                 )}
        //                 <Grid.Item
        //                     responsive={{
        //                         sm: 12,
        //                         md: 6,
        //                         lg: 5,
        //                         xl: 4,
        //                     }}
        //                 >
        //                     <Card>
        //                         <StyledCardHeader>
        //                             <StyledLeft>
        //                                 <StyledHeaderIcon
        //                                     path={
        //                                         globalField
        //                                             ? mdiLockOpen
        //                                             : mdiLock
        //                                     }
        //                                 ></StyledHeaderIcon>
        //                                 <div>Global Property</div>
        //                             </StyledLeft>
        //                             <StyledRight>
        //                                 <Switch
        //                                     title={`Make ${type} ${
        //                                         globalField
        //                                             ? 'private'
        //                                             : 'public'
        //                                     }`}
        //                                     value={globalField}
        //                                     onClick={() => {
        //                                         changeGlobal();
        //                                     }}
        //                                 ></Switch>
        //                             </StyledRight>
        //                         </StyledCardHeader>
        //                         <StyledCardContent>
        //                             Toggle whether the {type} is global.
        //                         </StyledCardContent>
        //                     </Card>
        //                 </Grid.Item>
        //                 {type !== 'insight' && (
        //                     <Grid.Item
        //                         responsive={{
        //                             sm: 12,
        //                             md: 6,
        //                             lg: 5,
        //                             xl: 4,
        //                         }}
        //                     >
        //                         <Card>
        //                             <StyledCardHeader>
        //                                 <StyledLeft>
        //                                     <StyledHeaderIcon
        //                                         path={mdiDelete}
        //                                     ></StyledHeaderIcon>
        //                                     <div>Delete {type}</div>
        //                                 </StyledLeft>
        //                                 <StyledRight>
        //                                     <Button
        //                                         // size={'sm'}
        //                                         // variant={'outline'}
        //                                         color={'error'}
        //                                         title={`Delete ${type}`}
        //                                         onClick={() => {
        //                                             setDeleteWorkflowModal(
        //                                                 true,
        //                                             );
        //                                         }}
        //                                     >
        //                                         Delete
        //                                     </Button>
        //                                 </StyledRight>
        //                             </StyledCardHeader>
        //                             <StyledCardContent>
        //                                 Delete {type}{' '}
        //                                 {type === 'database' &&
        //                                     'from the data catalog.'}
        //                                 {type === 'project' && '.'}
        //                             </StyledCardContent>
        //                         </Card>
        //                     </Grid.Item>
        //                 )}
        //             </Grid>
        //         </StyledSettings> */}
        //         <StyledFlexBetween>
        //             <StyledMembersCount>
        //                 <StyledAvatarsDiv>
        //                     {[
        //                         ...Array(
        //                             membersCount >= 5 ? 5 : membersCount,
        //                         ).keys(),
        //                     ].map((mem, i) => {
        //                         if (i >= 5) return; // We want to use break.
        //                         if (i === 4)
        //                             return (
        //                                 <StyledOverlappingDiv key={i}>
        //                                     {`+${membersCount - 4}`}
        //                                 </StyledOverlappingDiv>
        //                             );
        //                         return (
        //                             <StyledOverlappingImg
        //                                 key={i}
        //                                 src={i % 2 === 0 ? avatar : avatar1}
        //                             ></StyledOverlappingImg>
        //                         );
        //                     })}
        //                 </StyledAvatarsDiv>
        //                 <div>
        //                     <p>
        //                         {membersCount === 0 && 'No Members'}
        //                         {membersCount === 1 && '1 Member'}
        //                         {membersCount > 1 && `${membersCount} Members`}
        //                     </p>
        //                 </div>
        //             </StyledMembersCount>
        //             <Button
        //                 // size={'sm'}
        //                 onClick={() => {
        //                     // Get all users to add to DB
        //                     getUsersNoCreds();
        //                     // Open Add Member Modal
        //                     setAddMembersModal(true);
        //                 }}
        //             >
        //                 Add Member
        //             </Button>
        //         </StyledFlexBetween>
        //         {/* <StyledFlexEnd>
        //             <StyledMembersDiv>
        //                 <StyledMembersCount>
        //                     <div>
        //                         <p>{membersCount} Members</p>
        //                     </div>
        //                     <StyledAvatarsDiv>
        //                         {membersCount === 1 ? (
        //                             <StyledOverlappingDiv>
        //                                 1
        //                             </StyledOverlappingDiv>
        //                         ) : (
        //                             verifiedMembers.map((mem, i) => {
        //                                 if (i >= 5) return; // We want to use break.
        //                                 if (i === 4)
        //                                     return (
        //                                         <StyledOverlappingDiv key={i}>
        //                                             {`+${membersCount - 4}`}
        //                                         </StyledOverlappingDiv>
        //                                     );
        //                                 return (
        //                                     <StyledOverlappingImg
        //                                         key={i}
        //                                         src={
        //                                             i % 2 === 0
        //                                                 ? avatar
        //                                                 : avatar1
        //                                         }
        //                                     ></StyledOverlappingImg>
        //                                 );
        //                             })
        //                         )}
        //                     </StyledAvatarsDiv>
        //                 </StyledMembersCount>

        //                 <Button
        //                     size={'sm'}
        //                     onClick={() => {
        //                         // Get all users to add to DB
        //                         getUsersNoCreds();
        //                         // Open Add Member Modal
        //                         setAddMembersModal(true);
        //                     }}
        //                 >
        //                     Add Member
        //                 </Button>
        //             </StyledMembersDiv>
        //         </StyledFlexEnd> */}
        //         <StyledTableCont>
        //             <StyledHeader>
        //                 <StyledHeaderLeft>
        //                     <StyledTableLabel>Members</StyledTableLabel>
        //                 </StyledHeaderLeft>
        //                 <StyledHeaderRight>
        //                     {filterCount() >= 1 && (
        //                         <Button
        //                             color="grey"
        //                             variant={'text'}
        //                             title="Reset Filters"
        //                             onClick={() => {
        //                                 resetMembersFilters();
        //                             }}
        //                         >
        //                             <Icon path={mdiFilterRemove}></Icon>
        //                         </Button>
        //                     )}
        //                     <StyledFilter>
        //                         <Field
        //                             name={'MEMBER_SEARCH_FILTER'}
        //                             control={control}
        //                             rules={{}}
        //                             options={{
        //                                 component: 'input',
        //                                 placeholder: `Search members in ${type}`,
        //                                 size: 'md',
        //                             }}
        //                             description=""
        //                             layout="horizontal"
        //                             onChange={(val) => {
        //                                 // reset page
        //                                 setMembersPage(1);
        //                                 console.log('hello', val);
        //                             }}
        //                         ></Field>
        //                         <Popover>
        //                             <Popover.Trigger>
        //                                 <Button
        //                                     size={'md'}
        //                                     variant={'outline'}
        //                                     color={'primary'}
        //                                 >
        //                                     <StyledFlex>
        //                                         <Icon
        //                                             path={mdiAccountFilter}
        //                                         ></Icon>
        //                                         <p>Filters ({filterCount()})</p>
        //                                     </StyledFlex>
        //                                 </Button>
        //                             </Popover.Trigger>
        //                             <Popover.Content side={'bottom'}>
        //                                 <FilterLabel>Access Level:</FilterLabel>
        //                                 <Field
        //                                     name={'MEMBER_ACCESS_FILTER'}
        //                                     control={control}
        //                                     rules={{}}
        //                                     options={{
        //                                         component: 'select',
        //                                         options: [
        //                                             'Author',
        //                                             'Editor',
        //                                             'Read-Only',
        //                                         ],
        //                                         placeholder: 'Search ...',
        //                                     }}
        //                                     description=""
        //                                     layout="horizontal"
        //                                     onChange={() => {
        //                                         // reset page
        //                                         setMembersPage(1);
        //                                     }}
        //                                 ></Field>
        //                             </Popover.Content>
        //                         </Popover>
        //                     </StyledFilter>
        //                 </StyledHeaderRight>
        //             </StyledHeader>
        //             {showActionButtons('members-table') ? (
        //                 <StyledMessageRow warning={totalMembers}>
        //                     {selectAllMembers && !indeterminate && (
        //                         <>
        //                             {!totalMembers ? (
        //                                 <>
        //                                     <div>
        //                                         All{' '}
        //                                         <b>
        //                                             {' '}
        //                                             {
        //                                                 selectedMembers.length
        //                                             }{' '}
        //                                         </b>{' '}
        //                                         users on this page are selected.
        //                                     </div>
        //                                     <Button
        //                                         size={'sm'}
        //                                         variant={'text'}
        //                                         onClick={() => {
        //                                             setTotalMembers(true);
        //                                         }}
        //                                     >
        //                                         Select all {type} members
        //                                     </Button>
        //                                 </>
        //                             ) : (
        //                                 <>
        //                                     <div>
        //                                         <b>
        //                                             All {type} members have been
        //                                             selected
        //                                         </b>
        //                                     </div>
        //                                     <Button
        //                                         size={'sm'}
        //                                         variant={'text'}
        //                                         color="grey"
        //                                         onClick={() => {
        //                                             // State for showing buttons
        //                                             setTotalMembers(false);
        //                                             setSelectAllMembers(false);

        //                                             setSelectedMembers([]);
        //                                         }}
        //                                     >
        //                                         Clear Selected
        //                                     </Button>
        //                                 </>
        //                             )}
        //                         </>
        //                     )}
        //                     <Button
        //                         size={'sm'}
        //                         // variant={'text'}
        //                         color={'error'}
        //                         onClick={() => {
        //                             // open modal for delete
        //                             setDeleteMembersModal(true);
        //                         }}
        //                     >
        //                         <Icon path={mdiDelete}></Icon>
        //                         Delete Selected
        //                     </Button>
        //                     <Button
        //                         size={'sm'}
        //                         // variant={'text'}
        //                         color={'warning'}
        //                         onClick={() => {
        //                             setUpdateMembersModal(true);
        //                         }}
        //                     >
        //                         Update Selected
        //                     </Button>
        //                 </StyledMessageRow>
        //             ) : (
        //                 <></>
        //             )}

        //             {verifiedMembers.length ? (
        //                 <>
        //                     <Table striped={false} border={false}>
        //                         <Table.Head>
        //                             <Table.Row>
        //                                 <StyledSmallCell>
        //                                     <StyledCellContent>
        //                                         <StyledRowNum>
        //                                             &nbsp;
        //                                         </StyledRowNum>
        //                                         <Checkbox
        //                                             value={selectAllMembers}
        //                                             indeterminate={
        //                                                 indeterminate
        //                                             }
        //                                             onChange={() => {
        //                                                 if (
        //                                                     selectedMembers.length !==
        //                                                     verifiedMembers.length
        //                                                 ) {
        //                                                     setSelectedMembers(
        //                                                         verifiedMembers,
        //                                                     );
        //                                                     setSelectAllCheckboxState(
        //                                                         'members-table',
        //                                                         [
        //                                                             ...verifiedMembers,
        //                                                         ],
        //                                                     );
        //                                                 } else {
        //                                                     setSelectedMembers(
        //                                                         [],
        //                                                     );
        //                                                     setSelectAllCheckboxState(
        //                                                         'members-table',
        //                                                         [],
        //                                                     );
        //                                                 }
        //                                                 // warning message reset it
        //                                                 setTotalMembers(false);
        //                                             }}
        //                                         ></Checkbox>
        //                                     </StyledCellContent>
        //                                 </StyledSmallCell>
        //                                 <Table.Cell>Username</Table.Cell>
        //                                 <Table.Cell>Name</Table.Cell>
        //                                 <Table.Cell>Access</Table.Cell>
        //                                 <StyledSmallCell></StyledSmallCell>
        //                             </Table.Row>
        //                         </Table.Head>
        //                         <StyledTableBody>
        //                             {verifiedMembers.map((user, i) => {
        //                                 return (
        //                                     <StyledTableRow key={i}>
        //                                         <StyledSmallCell>
        //                                             <StyledCellContent>
        //                                                 <StyledRowNum>
        //                                                     {i + 1}
        //                                                 </StyledRowNum>
        //                                                 <Checkbox
        //                                                     value={isChecked(
        //                                                         'members-table',
        //                                                         user,
        //                                                     )}
        //                                                     onChange={async () => {
        //                                                         if (
        //                                                             isChecked(
        //                                                                 'members-table',
        //                                                                 user,
        //                                                             )
        //                                                         ) {
        //                                                             await removeSelectedUser(
        //                                                                 'members-table',
        //                                                                 user,
        //                                                             );
        //                                                         } else {
        //                                                             await addSelectedUser(
        //                                                                 'members-table',
        //                                                                 user,
        //                                                             );
        //                                                         }

        //                                                         setTotalMembers(
        //                                                             false,
        //                                                         );
        //                                                     }}
        //                                                 ></Checkbox>
        //                                             </StyledCellContent>
        //                                         </StyledSmallCell>
        //                                         <StyledProfileCell>
        //                                             <StyledCellContent>
        //                                                 <StyledAvatar
        //                                                     src={
        //                                                         i % 2 === 0
        //                                                             ? avatar
        //                                                             : avatar1
        //                                                     }
        //                                                 ></StyledAvatar>
        //                                                 <div>{user.id}</div>
        //                                             </StyledCellContent>
        //                                         </StyledProfileCell>
        //                                         <StyledAdditionalInfoCell>
        //                                             <StyledCellContent>
        //                                                 {user.name}
        //                                             </StyledCellContent>
        //                                         </StyledAdditionalInfoCell>
        //                                         <StyledCell>
        //                                             <StyledCellContent>
        //                                                 <StyledRadio
        //                                                     value={watch(
        //                                                         `MEMBERS.${i}.permission`,
        //                                                     )}
        //                                                     onChange={(val) => {
        //                                                         updateSelectedUsers(
        //                                                             [user],
        //                                                             val,
        //                                                         );
        //                                                     }}
        //                                                     orientation="horizontal"
        //                                                 >
        //                                                     <Radio.Item value="OWNER">
        //                                                         Author
        //                                                     </Radio.Item>

        //                                                     <Radio.Item value="EDIT">
        //                                                         Editor
        //                                                     </Radio.Item>

        //                                                     <Radio.Item value="READ_ONLY">
        //                                                         Read-Only
        //                                                     </Radio.Item>
        //                                                 </StyledRadio>
        //                                             </StyledCellContent>
        //                                         </StyledCell>
        //                                         <StyledSmallCell>
        //                                             <StyledCellContentQuickActions>
        //                                                 <Button
        //                                                     variant={'text'}
        //                                                     color={'error'}
        //                                                     onClick={(e) => {
        //                                                         e.stopPropagation();
        //                                                         // set user
        //                                                         setUserToDelete(
        //                                                             user,
        //                                                         );
        //                                                         // open modal
        //                                                         setDeleteMemberModal(
        //                                                             true,
        //                                                         );
        //                                                     }}
        //                                                 >
        //                                                     <Icon
        //                                                         path={mdiDelete}
        //                                                         size="md"
        //                                                     ></Icon>
        //                                                 </Button>
        //                                             </StyledCellContentQuickActions>
        //                                         </StyledSmallCell>
        //                                     </StyledTableRow>
        //                                 );
        //                             })}
        //                         </StyledTableBody>
        //                     </Table>
        //                 </>
        //             ) : (
        //                 <StyledMessageRow>No Members</StyledMessageRow>
        //             )}
        //             <StyledTableFooter>
        //                 <StyledTableFooterDiv></StyledTableFooterDiv>
        //                 <StyledTableFooterCenterDiv>
        //                     {filteredMembersCount ? (
        //                         <Pagination
        //                             value={membersPage}
        //                             total={Math.ceil(
        //                                 filteredMembersCount / limit,
        //                             )} // How do we solve this without knowing total members
        //                             onChange={(val) => {
        //                                 setMembersPage(val);
        //                             }}
        //                         ></Pagination>
        //                     ) : null}
        //                 </StyledTableFooterCenterDiv>
        //                 <StyledTableFooterDiv>
        //                     {filteredMembersCount
        //                         ? membersPage * limit - limit + 1
        //                         : 0}{' '}
        //                     -{' '}
        //                     {verifiedMembers.length !== limit
        //                         ? filteredMembersCount
        //                         : limit * membersPage}{' '}
        //                     of {filteredMembersCount} members
        //                 </StyledTableFooterDiv>
        //             </StyledTableFooter>
        //         </StyledTableCont>

        //         {pendingMembers.length ? (
        //             <StyledTableCont>
        //                 <StyledHeader>
        //                     <StyledHeaderLeft>
        //                         <StyledTableLabel>
        //                             Pending Member Requests (
        //                             {pendingMembers.length})
        //                         </StyledTableLabel>
        //                     </StyledHeaderLeft>
        //                     <StyledHeaderRight>
        //                         {showActionButtons('pending-table') ? (
        //                             <>
        //                                 <Button
        //                                     size={'sm'}
        //                                     variant={'text'}
        //                                     color={'error'}
        //                                     onClick={() => {
        //                                         setDenySelectedModal(true);
        //                                     }}
        //                                 >
        //                                     <Icon path={mdiDelete}></Icon>
        //                                     Deny Selected
        //                                 </Button>
        //                                 <Button
        //                                     size={'sm'}
        //                                     onClick={() => {
        //                                         // pass the selected pending members
        //                                         approveSelectedPendingMembers(
        //                                             selectedPendingMembers,
        //                                         );
        //                                     }}
        //                                 >
        //                                     Approve Selected
        //                                 </Button>
        //                             </>
        //                         ) : null}
        //                     </StyledHeaderRight>
        //                 </StyledHeader>
        //                 <Table striped={false} border={false}>
        //                     <Table.Head>
        //                         <Table.Row>
        //                             <StyledSmallCell>
        //                                 <StyledCellContent>
        //                                     <StyledRowNum>&nbsp;</StyledRowNum>
        //                                     <Checkbox
        //                                         value={selectAllPendingMembers}
        //                                         indeterminate={
        //                                             pendingMembersIndeterminate
        //                                         }
        //                                         onChange={() => {
        //                                             if (
        //                                                 selectedPendingMembers.length !==
        //                                                 pendingMembers.length
        //                                             ) {
        //                                                 // select all
        //                                                 setSelectedPendingMembers(
        //                                                     pendingMembers,
        //                                                 );
        //                                                 setSelectAllCheckboxState(
        //                                                     'pending-table',
        //                                                     [...pendingMembers],
        //                                                 );
        //                                             } else {
        //                                                 // unselect all
        //                                                 setSelectedPendingMembers(
        //                                                     [],
        //                                                 );
        //                                                 setSelectAllCheckboxState(
        //                                                     'pending-table',
        //                                                     [],
        //                                                 );
        //                                             }
        //                                         }}
        //                                     ></Checkbox>
        //                                 </StyledCellContent>
        //                             </StyledSmallCell>
        //                             <Table.Cell>Username</Table.Cell>
        //                             <Table.Cell>Request Date</Table.Cell>
        //                             <Table.Cell>Access</Table.Cell>
        //                             <Table.Cell></Table.Cell>
        //                         </Table.Row>
        //                     </Table.Head>
        //                     <StyledTableBody>
        //                         {/* <Scroll></Scroll> */}
        //                         {pendingMembers.map((user, i) => {
        //                             return (
        //                                 <Table.Row key={i}>
        //                                     <StyledCell>
        //                                         <StyledCellContent>
        //                                             <StyledRowNum>
        //                                                 {i + 1}
        //                                             </StyledRowNum>
        //                                             <Checkbox
        //                                                 value={isChecked(
        //                                                     'pending-table',
        //                                                     user,
        //                                                 )}
        //                                                 onChange={() => {
        //                                                     if (
        //                                                         isChecked(
        //                                                             'pending-table',
        //                                                             user,
        //                                                         )
        //                                                     ) {
        //                                                         console.log(
        //                                                             'remove',
        //                                                         );
        //                                                         removeSelectedUser(
        //                                                             'pending-table',
        //                                                             user,
        //                                                         );
        //                                                     } else {
        //                                                         console.log(
        //                                                             'add',
        //                                                         );
        //                                                         addSelectedUser(
        //                                                             'pending-table',
        //                                                             user,
        //                                                         );
        //                                                     }
        //                                                 }}
        //                                             ></Checkbox>
        //                                         </StyledCellContent>
        //                                     </StyledCell>
        //                                     <StyledProfileCell>
        //                                         <StyledCellContent>
        //                                             <StyledAvatar
        //                                                 src={
        //                                                     i % 2 === 0
        //                                                         ? avatar
        //                                                         : avatar1
        //                                                 }
        //                                             ></StyledAvatar>
        //                                             <div>
        //                                                 {user.REQUEST_USERID}
        //                                             </div>
        //                                         </StyledCellContent>
        //                                     </StyledProfileCell>
        //                                     <StyledAdditionalInfoCell>
        //                                         <StyledCellContent>
        //                                             {dayjs(
        //                                                 user.REQUEST_TIMESTAMP,
        //                                             ).format('MM/DD/YYYY')}
        //                                         </StyledCellContent>
        //                                     </StyledAdditionalInfoCell>
        //                                     <StyledCell>
        //                                         <StyledCellContent>
        //                                             <StyledRadio
        //                                                 value={user.PERMISSION}
        //                                                 orientation={
        //                                                     'horizontal'
        //                                                 }
        //                                             >
        //                                                 <Radio.Item
        //                                                     value="Author"
        //                                                     disabled
        //                                                 >
        //                                                     Author
        //                                                 </Radio.Item>

        //                                                 <Radio.Item
        //                                                     value="Editor"
        //                                                     disabled
        //                                                 >
        //                                                     Editor
        //                                                 </Radio.Item>

        //                                                 <Radio.Item
        //                                                     value="Read-Only"
        //                                                     disabled
        //                                                 >
        //                                                     Read-Only
        //                                                 </Radio.Item>
        //                                             </StyledRadio>
        //                                         </StyledCellContent>
        //                                     </StyledCell>
        //                                     <StyledCell>
        //                                         <StyledCellContentQuickActions>
        //                                             <Button
        //                                                 size="sm"
        //                                                 color="error"
        //                                                 onClick={() => {
        //                                                     denySelectedPendingMembers(
        //                                                         [user],
        //                                                         true,
        //                                                     );
        //                                                 }}
        //                                             >
        //                                                 <Icon
        //                                                     path={mdiClose}
        //                                                 ></Icon>
        //                                             </Button>
        //                                             <Button
        //                                                 size="sm"
        //                                                 color="primary"
        //                                                 onClick={() => {
        //                                                     approveSelectedPendingMembers(
        //                                                         [user],
        //                                                         true,
        //                                                     );
        //                                                 }}
        //                                             >
        //                                                 <Icon
        //                                                     path={mdiCheck}
        //                                                 ></Icon>
        //                                             </Button>
        //                                         </StyledCellContentQuickActions>
        //                                     </StyledCell>
        //                                 </Table.Row>
        //                             );
        //                         })}
        //                     </StyledTableBody>
        //                 </Table>
        //             </StyledTableCont>
        //         ) : null}

        //         <Modal
        //             open={denySelectedModal}
        //             onOpen={(open) => {
        //                 setDenySelectedModal(open);
        //             }}
        //             onClose={(open) => {
        //                 setDenySelectedModal(open);
        //             }}
        //         >
        //             <Modal.Content>
        //                 <Modal.Header>Are you sure?</Modal.Header>
        //                 <Modal.Body>
        //                     <p>This will deny all selected pending members</p>
        //                 </Modal.Body>
        //                 <StyledModalFooter>
        //                     <Button
        //                         color={'grey'}
        //                         variant={'text'}
        //                         onClick={() => setDenySelectedModal(false)}
        //                     >
        //                         Close
        //                     </Button>
        //                     <Button
        //                         color={'error'}
        //                         onClick={() => {
        //                             // pass selected pending members
        //                             denySelectedPendingMembers(
        //                                 selectedPendingMembers,
        //                             );
        //                         }}
        //                     >
        //                         Deny
        //                     </Button>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>

        //         <Modal
        //             open={addMembersModal}
        //             onOpen={(open) => {
        //                 setAddMembersModal(open);
        //                 // clear selected non cred users array
        //                 setValue('SELECTED_NON_CREDENTIALED_USERS', []);
        //                 setValue('ADD_MEMBER_PERMISSION', '');
        //             }}
        //             onClose={(open) => {
        //                 setAddMembersModal(open);
        //                 // clear selected non cred users
        //                 setValue('SELECTED_NON_CREDENTIALED_USERS', []);
        //                 setValue('ADD_MEMBER_PERMISSION', '');
        //             }}
        //         >
        //             <Modal.Content size={'lg'}>
        //                 <Modal.Header>Add members to {type}</Modal.Header>
        //                 <Modal.Body>
        //                     <>
        //                         <StyledField>
        //                             <Controller
        //                                 name={`SELECTED_NON_CREDENTIALED_USERS`}
        //                                 control={control}
        //                                 rules={{ required: true }}
        //                                 render={({ field, fieldState }) => {
        //                                     const hasError = fieldState.error;

        //                                     return (
        //                                         <Form.Field>
        //                                             <Select
        //                                                 // ${db.app_name}
        //                                                 placeholder={`Select all users you would like to give access to `}
        //                                                 options={
        //                                                     nonCredentialedUsers
        //                                                 }
        //                                                 onChange={(value) => {
        //                                                     if (
        //                                                         value.length ===
        //                                                         0
        //                                                     ) {
        //                                                         // clear add member permission
        //                                                         setValue(
        //                                                             'ADD_MEMBER_PERMISSION',
        //                                                             '',
        //                                                         );
        //                                                     }
        //                                                     field.onChange(
        //                                                         value,
        //                                                     );
        //                                                 }}
        //                                                 multiple={true}
        //                                                 getDisplay={getDisplay}
        //                                             />
        //                                         </Form.Field>
        //                                     );
        //                                 }}
        //                             />
        //                         </StyledField>

        //                         <StyledField>
        //                             <Field
        //                                 name={'ADD_MEMBER_PERMISSION'}
        //                                 control={control}
        //                                 rules={{
        //                                     required: true,
        //                                 }}
        //                                 description=""
        //                                 options={{
        //                                     component: 'radio',
        //                                     options: [
        //                                         {
        //                                             display: 'Author',
        //                                             value: 'Author',
        //                                         },
        //                                         {
        //                                             display: 'Editor',
        //                                             value: 'Editor',
        //                                         },
        //                                         {
        //                                             display: 'Read-Only',
        //                                             value: 'Read-Only',
        //                                         },
        //                                     ],
        //                                 }}
        //                                 disabled={
        //                                     selectedNonCredentialedUsers.length ===
        //                                     0
        //                                 }
        //                                 label="Selected members access level"
        //                             ></Field>
        //                         </StyledField>
        //                     </>
        //                 </Modal.Body>
        //                 <StyledModalFooter>
        //                     <Modal.Close>
        //                         <Button color={'grey'} variant="text">
        //                             Close
        //                         </Button>
        //                     </Modal.Close>
        //                     <Modal.Close>
        //                         <Button
        //                             color={'success'}
        //                             onClick={(e) => {
        //                                 //stop the bubbling on close modal
        //                                 e.preventDefault();

        //                                 if (
        //                                     addMemberPermissionField &&
        //                                     selectedNonCredentialedUsers.length >
        //                                         0
        //                                 ) {
        //                                     submitNonCredUsers();
        //                                 } else {
        //                                     notification.add({
        //                                         color: 'error',
        //                                         content: `Please provide a permission along with selected users to add members to ${type}`,
        //                                     });
        //                                 }
        //                             }}
        //                         >
        //                             Submit
        //                         </Button>
        //                     </Modal.Close>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>

        //         <Modal
        //             open={deleteMemberModal}
        //             onOpen={(open) => {
        //                 setDeleteMemberModal(open);
        //             }}
        //             onClose={(open) => {
        //                 setDeleteMemberModal(open);
        //                 setUserToDelete(null);
        //             }}
        //         >
        //             <Modal.Content>
        //                 <Modal.Header>Are you sure?</Modal.Header>
        //                 <Modal.Body>
        //                     <p>
        //                         {userToDelete && ( // Possibly null
        //                             <>
        //                                 This will remove{' '}
        //                                 <b>{userToDelete.name}</b> from the{' '}
        //                                 {type}
        //                             </>
        //                         )}
        //                         .
        //                     </p>
        //                 </Modal.Body>
        //                 <StyledModalFooter>
        //                     <Button
        //                         color={'grey'}
        //                         variant={'text'}
        //                         onClick={() => setDeleteMemberModal(false)}
        //                     >
        //                         Close
        //                     </Button>
        //                     <Button
        //                         color={'error'}
        //                         onClick={() => {
        //                             if (!userToDelete) {
        //                                 console.error('No user to delete');
        //                             }
        //                             deleteSelectedMembers([userToDelete]);

        //                             // clean-up
        //                             setDeleteMemberModal(false);
        //                             setUserToDelete(null);
        //                         }}
        //                     >
        //                         Confirm
        //                     </Button>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>

        //         <Modal
        //             open={deleteMembersModal}
        //             onOpen={(open) => {
        //                 setDeleteMembersModal(open);
        //             }}
        //             onClose={(open) => {
        //                 setDeleteMembersModal(open);
        //             }}
        //         >
        //             <Modal.Content size={'md'}>
        //                 <Modal.Header>Are you sure?</Modal.Header>
        //                 <Modal.Body>
        //                     <p>
        //                         This will permanetly remove{' '}
        //                         <b>
        //                             {totalMembers
        //                                 ? 'ALL MEMBERS'
        //                                 : `all ${selectedMembers.length} selected members on this page`}
        //                         </b>{' '}
        //                         from this {type}. If you would like to add
        //                         members back, please hit the &quot;Add
        //                         Members&quot; button on the {type} members
        //                         table.
        //                     </p>
        //                 </Modal.Body>
        //                 <StyledModalFooter>
        //                     <Modal.Close>
        //                         <Button color={'grey'} variant="text">
        //                             Close
        //                         </Button>
        //                     </Modal.Close>
        //                     <Modal.Close>
        //                         <Button
        //                             color={'error'}
        //                             onClick={(e) => {
        //                                 e.preventDefault();
        //                                 if (totalMembers) {
        //                                     deleteAllMembers();
        //                                 } else {
        //                                     // if (type === 'project') {
        //                                     //     console.error(
        //                                     //         'Fix MonolithStore removeProjectUserPermissions',
        //                                     //     );
        //                                     //     return;
        //                                     // }
        //                                     // delete selected members
        //                                     deleteSelectedMembers(
        //                                         selectedMembers,
        //                                     );
        //                                 }
        //                             }}
        //                         >
        //                             Confirm
        //                         </Button>
        //                     </Modal.Close>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>

        //         <Modal
        //             open={updateMembersModal}
        //             onOpen={(open) => {
        //                 setUpdateMembersModal(open);
        //             }}
        //             onClose={(open) => {
        //                 setUpdateMembersModal(open);
        //                 setValue('UPDATE_SELECTED_PERMISSION', '');
        //             }}
        //         >
        //             <Modal.Content>
        //                 <Modal.Header>Update permissions</Modal.Header>
        //                 <Modal.Body>
        //                     {totalMembers ? (
        //                         <p>
        //                             Select a permission below and it will update{' '}
        //                             <b>ALL MEMBERS </b> associated with {type}
        //                         </p>
        //                     ) : (
        //                         <p>
        //                             Select permission below and submit to update
        //                             the{' '}
        //                             {selectedMembers.length === 1 ? (
        //                                 'selected user.'
        //                             ) : (
        //                                 <>
        //                                     <b> {selectedMembers.length} </b>
        //                                     selected users.
        //                                 </>
        //                             )}
        //                         </p>
        //                     )}
        //                     <br></br>
        //                     <Field
        //                         name={`UPDATE_SELECTED_PERMISSION`}
        //                         control={control}
        //                         rules={{ required: true }}
        //                         label={'Permission'}
        //                         options={{
        //                             component: 'radio',
        //                             options: [
        //                                 {
        //                                     display: 'Author',
        //                                     value: 'Author',
        //                                 },
        //                                 {
        //                                     display: 'Editor',
        //                                     value: 'Editor',
        //                                 },
        //                                 {
        //                                     display: 'Read-Only',
        //                                     value: 'Read-Only',
        //                                 },
        //                             ],
        //                         }}
        //                         description=""
        //                     ></Field>
        //                     <br></br>
        //                 </Modal.Body>
        //                 <StyledModalFooter>
        //                     <Button
        //                         color={'grey'}
        //                         variant={'text'}
        //                         onClick={() => setUpdateMembersModal(false)}
        //                     >
        //                         Close
        //                     </Button>
        //                     <Button
        //                         color={'success'}
        //                         onClick={(e) => {
        //                             // in order to validate
        //                             e.stopPropagation();

        //                             // validate whether field is there
        //                             if (!updatedPermissionField) {
        //                                 notification.add({
        //                                     color: 'error',
        //                                     content:
        //                                         'Select permission level for selected users',
        //                                 });
        //                                 return;
        //                             }

        //                             if (totalMembers) {
        //                                 updateAllMembers();
        //                             } else {
        //                                 updateSelectedUsers(
        //                                     selectedMembers,
        //                                     '',
        //                                 );
        //                             }
        //                         }}
        //                     >
        //                         Update Users
        //                     </Button>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>

        //         <Modal
        //             open={deleteWorkflowModal}
        //             onOpen={(open) => {
        //                 setDeleteWorkflowModal(open);
        //             }}
        //             onClose={(open) => {
        //                 setDeleteWorkflowModal(open);
        //             }}
        //         >
        //             <Modal.Content>
        //                 <Modal.Header>Are you sure?</Modal.Header>
        //                 <Modal.Body>
        //                     This will immediately delete {name},{' '}
        //                     <b>this action is irreversible</b>.
        //                 </Modal.Body>

        //                 <StyledModalFooter>
        //                     <Button
        //                         color={'grey'}
        //                         variant={'text'}
        //                         onClick={() => {
        //                             setDeleteWorkflowModal(false);
        //                         }}
        //                     >
        //                         Close
        //                     </Button>
        //                     <Button
        //                         color={'error'}
        //                         onClick={() => {
        //                             deleteWorkflow();
        //                         }}
        //                     >
        //                         Delete {type}{' '}
        //                     </Button>
        //                 </StyledModalFooter>
        //             </Modal.Content>
        //         </Modal>
        //     </Form>
        //     <div ref={pendingTableRef}> </div>
        // </StyledSelectedApp>
    );
};

export default Permissions;

const PendingMembersTable = (props) => {
    const { name, type, adminMode, id, getPendingUsersString, projectId } =
        props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    const [selectedPending, setSelectedPending] = useState([]);
    const [pendingCount, setPendingCOunt] = useState(0);

    const { control, watch, setValue } = useForm<{
        PENDING_MEMBERS: PendingMember[];
    }>({
        defaultValues: {
            // Members Table
            PENDING_MEMBERS: [],
        },
    });

    const { remove: pendingMemberRemove } = useFieldArray({
        control,
        name: 'PENDING_MEMBERS',
    });
    const pendingMembers = watch('PENDING_MEMBERS');

    // Pending Member Requests Pixel call
    const pendingUserAccess = usePixel<
        {
            ENGINEID: string;
            ID: string;
            PERMISSION: number;
            REQUEST_TIMESTAMP: string;
            REQUEST_TYPE: string;
            REQUEST_USERID: string;
        }[]
    >(adminMode ? getPendingUsersString : '');

    /**
     * @name useEffect
     * @desc - sets pending members in react hook form
     */
    useEffect(() => {
        // pixel call to get pending members
        if (pendingUserAccess.status !== 'SUCCESS' || !pendingUserAccess.data) {
            return;
        }

        const newPendingMembers = [];

        pendingUserAccess.data.forEach((mem) => {
            newPendingMembers.push({
                ...mem,
                PERMISSION: permissionMapper[mem.PERMISSION], // comes in as 1,2,3 -> map to Author, Edit, Read-only
            });
        });

        // set new members with the Pending Members in react hook form
        setValue('PENDING_MEMBERS', newPendingMembers);

        // notify user for pending members
        if (newPendingMembers.length) {
            let message =
                newPendingMembers.length === 1
                    ? `1 member has `
                    : `${newPendingMembers.length} members have `;

            message += `requested access to this ${type}`;
        }

        return () => {
            console.log('cleaning Pending Members');
            // setValue('PENDING_MEMBERS', []);
            // setSelectedPendingMembers([]);
            // setSelectAllPendingMembers(false);
            // setPendingMembersIndeterminate(false);
        };
    }, [pendingUserAccess.status, pendingUserAccess.data]);

    /** API Functions */
    /**
     * @name approvePendingMembers
     * @param members - members to pass to approve api call
     * @description Approve list of Pending Members
     */
    const approvePendingMembers = (
        members: PendingMember[],
        quickActionFlag?: boolean, // quick approve button
    ) => {
        const requests = [];
        // construct requests for post data
        members.forEach((mem, i) => {
            const memberRequest = {
                requestid: mem.ID,
                userid: mem.REQUEST_USERID,
                permission: permissionMapper[mem.PERMISSION],
            };
            requests.push(memberRequest);
        });

        debugger;

        return;
        // hit api with req'd fields
        monolithStore[mapMonolithFunction(type, 'ApproveUserRequest')](
            adminMode,
            id,
            requests,
            projectId,
        )
            .then((response) => {
                debugger;
                // if (response.success) {
                // get index of pending members in order to remove
                const indexesToRemove = [];
                requests.forEach((mem) => {
                    pendingMembers.find((m, i) => {
                        if (mem.userid === m.REQUEST_USERID)
                            indexesToRemove.push(i);
                    });
                });

                debugger;
                // remove indexes
                pendingMemberRemove(indexesToRemove);

                if (!quickActionFlag) {
                    // remove from selected pending members
                    setSelectedPending([]);
                } else {
                    let indexToRemoveFromSelected;
                    // remove from selected
                    selectedPending.find((m, i) => {
                        if (m.ID !== requests[0].requestid) {
                            indexToRemoveFromSelected = i;
                        }
                    });

                    const filteredArr = selectedPending.splice(
                        indexToRemoveFromSelected,
                        1,
                    );

                    setSelectedPending(filteredArr);
                }

                notification.add({
                    color: 'success',
                    content: 'Succesfully approved user permissions',
                });
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /**
     * @name denyPendingMembers
     * @param members - members to pass to deny api call
     * @param quickActionFlag - quick deny button on table
     * @description Deny Selected Pending Members
     */
    const denyPendingMembers = (
        members: PendingMember[],
        quickActionFlag?: boolean,
    ) => {
        const requestIds = [];
        // construct userids for post data
        members.forEach((mem: PendingMember, i) => {
            requestIds.push(mem.ID);
        });

        debugger;

        return;

        // hit api with req'd fields
        monolithStore[mapMonolithFunction(type, 'DenyUserRequest')](
            adminMode,
            id,
            requestIds,
            projectId,
        )
            .then((response) => {
                // get index of pending members in order to remove
                const indexesToRemove = [];
                requestIds.forEach((mem) => {
                    pendingMembers.find((m, i) => {
                        if (mem === m.ID) indexesToRemove.push(i);
                    });
                });

                // remove indexes from react hook form
                pendingMemberRemove(indexesToRemove);

                if (!quickActionFlag) {
                    setSelectedPendingMembers([]);
                    setSelectAllCheckboxState('pending-table', []);
                    // close modal
                    setDenySelectedModal(false);
                } else {
                    // remove from selected pending members
                    let indexToRemoveFromSelected = 0;
                    // remove from selected
                    selectedPendingMembers.find((m, i) => {
                        if (m.ID !== requestIds[0]) {
                            indexToRemoveFromSelected = i;
                        }
                    });

                    const filteredArr = selectedPendingMembers.splice(
                        indexToRemoveFromSelected,
                        1,
                    );

                    setSelectedPendingMembers(filteredArr);
                    setSelectAllCheckboxState('pending-table', filteredArr);
                    // close modal
                    setDenySelectedModal(false);
                }

                notification.add({
                    color: 'success',
                    content: 'Succesfully denied user permissions',
                });
            })
            .catch((error) => {
                // show err to user
                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /** HELPERS */

    /**
     * @name updatePendingMemberPermission
     * @param mem
     * @param value
     * @desc Updates Member Permission
     */
    const updatePendingMemberPermission = (
        mem: PendingMember,
        value: 'Author' | 'Editor' | 'Read-Only',
    ) => {
        const updatedPendingMems = pendingMembers.map((user) => {
            if (user.REQUEST_USERID === mem.REQUEST_USERID) {
                return {
                    ...user,
                    PERMISSION: value,
                };
            } else {
                return user;
            }
        });

        setValue('PENDING_MEMBERS', updatedPendingMems);
    };

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>{name}</Typography>
                        </StyledTableTitleDiv>

                        <StyledTableTitleMemberCountContainer>
                            <StyledTableTitleMemberCount>
                                <Typography variant={'body1'}>
                                    6 Members
                                </Typography>
                            </StyledTableTitleMemberCount>
                        </StyledTableTitleMemberCountContainer>

                        <StyledFilterButtonContainer>
                            <IconButton>
                                <FilterAltRounded></FilterAltRounded>
                            </IconButton>
                        </StyledFilterButtonContainer>

                        {selectedPending.length > 0 && (
                            <>
                                <StyledDeleteSelectedContainer>
                                    <Button
                                        variant={'contained'}
                                        color="error"
                                        onClick={() => {}}
                                    >
                                        Deny Selected
                                    </Button>
                                </StyledDeleteSelectedContainer>
                                <StyledAddMemberContainer>
                                    <Button
                                        variant={'contained'}
                                        onClick={() => {}}
                                    >
                                        Approve Selected
                                    </Button>
                                </StyledAddMemberContainer>
                            </>
                        )}
                    </StyledTableTitleContainer>
                    <StyledMemberTable>
                        <MuiTable.Head>
                            <MuiTable.Row>
                                <MuiTable.Cell>
                                    <MuiCheckbox
                                        checked={
                                            selectedPending.length ===
                                                pendingMembers.length &&
                                            pendingMembers.length > 0
                                        }
                                        onChange={() => {
                                            if (
                                                selectedPending.length !==
                                                pendingMembers.length
                                            ) {
                                                setSelectedPending(
                                                    pendingMembers,
                                                );
                                            } else {
                                                setSelectedPending([]);
                                            }
                                        }}
                                    />
                                </MuiTable.Cell>
                                <MuiTable.Cell>Name</MuiTable.Cell>
                                <MuiTable.Cell>Permission</MuiTable.Cell>
                                <MuiTable.Cell>Request Date</MuiTable.Cell>
                                <MuiTable.Cell>Actions</MuiTable.Cell>
                            </MuiTable.Row>
                        </MuiTable.Head>
                        <MuiTable.Body>
                            {pendingMembers.map((user: PendingMember, i) => {
                                const isSelected = selectedPending.some(
                                    (value: PendingMember) => {
                                        return (
                                            value.REQUEST_USERID ===
                                            user.REQUEST_USERID
                                        );
                                    },
                                );
                                return (
                                    <MuiTable.Row key={i}>
                                        <MuiTable.Cell>
                                            <MuiCheckbox
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (isSelected) {
                                                        const selPending = [];
                                                        selectedPending.forEach(
                                                            (
                                                                u: PendingMember,
                                                            ) => {
                                                                if (
                                                                    u.REQUEST_USERID !==
                                                                    user.REQUEST_USERID
                                                                )
                                                                    selPending.push(
                                                                        u,
                                                                    );
                                                            },
                                                        );

                                                        setSelectedPending(
                                                            selPending,
                                                        );
                                                    } else {
                                                        setSelectedPending([
                                                            ...selectedPending,
                                                            user,
                                                        ]);
                                                    }
                                                }}
                                            />
                                        </MuiTable.Cell>
                                        <MuiTable.Cell
                                            component="td"
                                            scope="row"
                                        >
                                            {user.REQUEST_USERID}
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            <RadioGroup
                                                row
                                                value={user.PERMISSION}
                                                onChange={(e) => {
                                                    debugger;
                                                    updatePendingMemberPermission(
                                                        user,
                                                        e.target.value,
                                                    );
                                                }}
                                            >
                                                <RadioGroup.Item
                                                    value="Author"
                                                    label="Author"
                                                />
                                                <RadioGroup.Item
                                                    value="Editor"
                                                    label="Editor"
                                                />
                                                <RadioGroup.Item
                                                    value="Read-Only"
                                                    label="Read-Only"
                                                />
                                            </RadioGroup>
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            {user.REQUEST_TIMESTAMP}
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            <IconButton
                                                onClick={() => {
                                                    approvePendingMembers(
                                                        [user],
                                                        true,
                                                    );
                                                }}
                                            >
                                                <Check color={'success'} />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => {
                                                    denyPendingMembers(
                                                        [user],
                                                        true,
                                                    );
                                                }}
                                            >
                                                <Close />
                                            </IconButton>
                                        </MuiTable.Cell>
                                    </MuiTable.Row>
                                );
                            })}
                        </MuiTable.Body>
                    </StyledMemberTable>
                </StyledTableContainer>
            </StyledMemberInnerContent>
        </StyledMemberContent>
    );
};

const StyledModalContentText = MuiStyled(Modal.ContentText)({
    display: 'flex',
    flexDirection: 'column',
    gap: '.5rem',
});
interface NonCredentialedUsers {}

const MembersTable = (props) => {
    const { name, type, adminMode, id, reactorPrefix, projectId } = props;
    const { monolithStore } = useRootStore();
    const notification = useNotification();

    /** Member Table State */
    const [membersCount, setMembersCount] = useState<number>(0);
    const [filteredMembersCount, setFilteredMembersCount] = useState<number>(0);
    const [membersPage, setMembersPage] = useState<number>(1);
    const [limit, setLimit] = useState<number>(5);
    const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);

    /** Delete Member */
    const [deleteMembersModal, setDeleteMembersModal] =
        useState<boolean>(false);
    const [deleteMemberModal, setDeleteMemberModal] = useState<boolean>(false);
    const [userToDelete, setUserToDelete] = useState<Member | null>();

    /** Add Member State */
    const [addMembersModal, setAddMembersModal] = useState<boolean>(false);
    const [nonCredentialedUsers, setNonCredentialedUsers] = useState([]);
    const [selectedNonCredentialedUsers, setSelectedNonCredentialedUsers] =
        useState([]);
    const [addMemberRole, setAddMemberRole] = useState<
        'Author' | 'Editor' | 'Read-Only' | ''
    >('');

    const didMount = useRef<boolean>(false);

    const { control, watch, setValue } = useForm<{
        MEMBERS: Member[];

        SEARCH_FILTER: string;
        ACCESS_FILTER: string;
    }>({
        defaultValues: {
            // Members Table
            MEMBERS: [],
            // Filters for Members table
            SEARCH_FILTER: '',
            ACCESS_FILTER: '',
        },
    });

    const { remove: memberRemove } = useFieldArray({
        control,
        name: 'MEMBERS',
    });

    const searchFilter = watch('SEARCH_FILTER');
    const permissionFilter = watch('ACCESS_FILTER');
    const verifiedMembers = watch('MEMBERS');

    const getMembers = useAPI([
        reactorPrefix,
        adminMode,
        id,
        searchFilter ? searchFilter : undefined,
        permissionMapper[permissionFilter],
        membersPage * limit - limit, // offset
        limit,
        projectId, // make optional --> handles insight
    ]);

    /**
     * @name useEffect
     * @desc - sets members in react hook form
     */
    useEffect(() => {
        if (getMembers.status !== 'SUCCESS' || !getMembers.data) {
            return;
        }

        const members = [];

        getMembers.data['members'].forEach((mem) => {
            members.push(mem);
        });

        setValue('MEMBERS', members);

        if (!didMount.current) {
            // set total members
            setMembersCount(getMembers.data['totalMembers']);
            didMount.current = true;
        }

        // Needed for total pages on pagination
        setFilteredMembersCount(getMembers.data['totalMembers']);

        return () => {
            console.log('Cleaning members table');
            setValue('MEMBERS', []);
            setSelectedMembers([]);
        };
    }, [getMembers.status, getMembers.data, searchFilter, permissionFilter]);

    /** MEMBER TABLE FUNCTIONS */
    const updateSelectedUsers = (members, quickUpdate) => {
        // Construct to send to API
        const userArr = [];

        members.forEach((mem, i) => {
            userArr.push({
                userid: mem.id,
                permission: quickUpdate ? quickUpdate : 'OWNER',
            });
        });

        monolithStore[mapMonolithFunction(type, 'UpdatePermissions')](
            adminMode,
            id,
            userArr,
            projectId,
        )
            .then((resp) => {
                notification.add({
                    color: 'success',
                    content: 'Updated member permssions',
                });
            })
            .catch((err) => {
                notification.add({
                    color: 'error',
                    content: err,
                });
                getMembers.refresh();
            });
    };

    /**
     * @name deleteSelectedMembers
     * @param members
     */
    const deleteSelectedMembers = (members: Member[]) => {
        const userArr = [];
        members.forEach((mem, i) => {
            userArr.push(mem.id);
        });

        monolithStore[mapMonolithFunction(type, 'RemoveUserPermissions')](
            adminMode,
            id,
            userArr,
            projectId,
        )
            .then((resp) => {
                if (
                    verifiedMembers.length === userArr.length &&
                    membersPage !== 1 &&
                    membersPage !== filteredMembersCount / limit
                ) {
                    setMembersPage(membersPage - 1);
                }

                // get index of members in order to remove
                const indexesToRemove = [];
                userArr.forEach((mem) => {
                    verifiedMembers.find((m, i) => {
                        if (mem === m.id) indexesToRemove.push(i);
                    });
                });

                // remove indexes from react hook form
                memberRemove(indexesToRemove);

                const newMemberCount = membersCount - userArr.length;
                setMembersCount(newMemberCount);

                // Clean selected Members in state
                if (!userToDelete) {
                    setSelectedMembers([]);
                    setDeleteMembersModal(false);
                } else {
                    // Quick Delete one member
                    const filteredSelectedMembers = selectedMembers.filter(
                        // find the single member that is being deleted and remove from selected members
                        (m) => m.id !== userToDelete.id,
                    );

                    // set new selected members
                    setSelectedMembers(filteredSelectedMembers);
                    setDeleteMemberModal(false);
                }

                notification.add({
                    color: 'success',
                    content: `Successfully removed ${
                        userArr.length > 1 ? 'members' : 'member'
                    } from ${type}`,
                });

                getMembers.refresh();
            })
            .catch((error) => {
                notification.add({
                    color: 'error',
                    content: error,
                });

                setDeleteMembersModal(false);
            });
    };

    /** ADD MEMBER FUNCTIONS */
    /**
     * @name getUsersNoCreds
     * @desc Gets all users without credentials
     */
    const getUsersNoCreds = () => {
        monolithStore[mapMonolithFunction(type, 'GetNonCredUsers')](
            adminMode,
            id,
            projectId, // req'd for insight level calls
        )
            .then((response) => {
                setNonCredentialedUsers(response);

                setAddMembersModal(true);
            })
            .catch((err) => {
                // throw error if promise doesn't fulfill
                throw Error(err);
            });
    };

    /**
     * @name submitNonCredUsers
     */
    const submitNonCredUsers = () => {
        const userRequests = [];
        // construct for API
        selectedNonCredentialedUsers.forEach((mem, i) => {
            const requestTemplate = {
                userid: mem.id,
                permission: permissionMapper[addMemberRole],
            };
            userRequests.push(requestTemplate);
        });

        monolithStore[mapMonolithFunction(type, 'AddMember')](
            adminMode,
            id,
            userRequests,
            projectId,
        ) // fix this with projectId
            .then((resp) => {
                getMembers.refresh();

                setMembersCount(
                    membersCount + selectedNonCredentialedUsers.length,
                );
                setAddMembersModal(false);
                setSelectedNonCredentialedUsers([]);
                setAddMemberRole('');

                // setSelectedMembers([]);
                // setSelectAllCheckboxState('members-table', []);

                notification.add({
                    color: 'success',
                    content: 'Successfully added member permissions',
                });
            })
            .catch((error) => {
                setAddMembersModal(false);
                setSelectedNonCredentialedUsers([]);
                setAddMemberRole('');

                notification.add({
                    color: 'error',
                    content: error,
                });
            });
    };

    /** HELPERS */
    const Avatars = useMemo(() => {
        if (!verifiedMembers.length) return [];

        let i = 0;
        let avatarList = [];
        while (i < 5 && i < verifiedMembers.length) {
            avatarList.push(
                <Avatar key={i}>
                    {verifiedMembers[i].name.charAt(0).toUpperCase()}
                </Avatar>,
            );

            i++;
        }

        return avatarList;
    }, [filteredMembersCount, verifiedMembers.length]);

    const paginationOptions = {
        membersPageCounts: [5],
    };

    membersCount > 9 && paginationOptions.membersPageCounts.push(10);
    membersCount > 19 && paginationOptions.membersPageCounts.push(20);

    /** END OF HELPERS */

    /** LOADING */
    if (getMembers.status !== 'SUCCESS' && !didMount.current) {
        return <LoadingScreen.Trigger description="Getting members" />;
    }

    return (
        <StyledMemberContent>
            <StyledMemberInnerContent>
                <StyledTableContainer>
                    <StyledTableTitleContainer>
                        <StyledTableTitleDiv>
                            <Typography variant={'h6'}>{name}</Typography>
                        </StyledTableTitleDiv>

                        <StyledTableTitleMemberContainer>
                            <StyledAvatarGroupContainer>
                                <AvatarGroup
                                    spacing={'small'}
                                    variant={'circular'}
                                    max={4}
                                    total={filteredMembersCount}
                                >
                                    {Avatars.map((el) => {
                                        return el;
                                    })}
                                </AvatarGroup>
                            </StyledAvatarGroupContainer>
                            <StyledTableTitleMemberCountContainer>
                                <StyledTableTitleMemberCount>
                                    <Typography variant={'body1'}>
                                        {filteredMembersCount} Members
                                    </Typography>
                                </StyledTableTitleMemberCount>
                            </StyledTableTitleMemberCountContainer>
                        </StyledTableTitleMemberContainer>

                        <StyledSearchButtonContainer>
                            <IconButton>
                                <SearchOutlined></SearchOutlined>
                            </IconButton>
                        </StyledSearchButtonContainer>

                        <StyledFilterButtonContainer>
                            <IconButton>
                                <FilterAltRounded></FilterAltRounded>
                            </IconButton>
                        </StyledFilterButtonContainer>

                        <StyledDeleteSelectedContainer>
                            {selectedMembers.length > 0 && (
                                <Button
                                    variant={'contained'}
                                    color="error"
                                    onClick={() => setDeleteMembersModal(true)}
                                >
                                    Delete Selected
                                </Button>
                            )}
                        </StyledDeleteSelectedContainer>
                        <StyledAddMemberContainer>
                            <Button
                                variant={'contained'}
                                onClick={() => {
                                    getUsersNoCreds();
                                }}
                            >
                                Add Members{' '}
                            </Button>
                        </StyledAddMemberContainer>
                    </StyledTableTitleContainer>
                    <StyledMemberTable>
                        <MuiTable.Head>
                            <MuiTable.Row>
                                <MuiTable.Cell>
                                    <MuiCheckbox
                                        checked={
                                            selectedMembers.length ===
                                            verifiedMembers.length
                                        }
                                        onChange={() => {
                                            if (
                                                selectedMembers.length !==
                                                verifiedMembers.length
                                            ) {
                                                setSelectedMembers(
                                                    verifiedMembers,
                                                );
                                            } else {
                                                setSelectedMembers([]);
                                            }
                                        }}
                                    />
                                </MuiTable.Cell>
                                <MuiTable.Cell>Name</MuiTable.Cell>
                                <MuiTable.Cell>Permission</MuiTable.Cell>
                                <MuiTable.Cell>Permission Date</MuiTable.Cell>
                                <MuiTable.Cell>Action</MuiTable.Cell>
                            </MuiTable.Row>
                        </MuiTable.Head>
                        <MuiTable.Body sx={{ minHeight: '50rem' }}>
                            {verifiedMembers.map((user, i) => {
                                const isSelected = selectedMembers.some(
                                    (value) => {
                                        return value.id === user.id;
                                    },
                                );
                                return (
                                    <MuiTable.Row key={user.name + i}>
                                        <MuiTable.Cell>
                                            <MuiCheckbox
                                                checked={isSelected}
                                                onChange={() => {
                                                    if (isSelected) {
                                                        const selMembers = [];
                                                        selectedMembers.forEach(
                                                            (u) => {
                                                                if (
                                                                    u.id !==
                                                                    user.id
                                                                )
                                                                    selMembers.push(
                                                                        u,
                                                                    );
                                                            },
                                                        );
                                                        setSelectedMembers(
                                                            selMembers,
                                                        );
                                                    } else {
                                                        setSelectedMembers([
                                                            ...selectedMembers,
                                                            user,
                                                        ]);
                                                    }
                                                }}
                                            />
                                        </MuiTable.Cell>
                                        <MuiTable.Cell
                                            component="td"
                                            scope="row"
                                        >
                                            {user.id}: {user.name}
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            <RadioGroup
                                                row
                                                defaultValue={
                                                    permissionMapper[
                                                        user.permission
                                                    ]
                                                }
                                                onChange={(e) => {
                                                    console.log(
                                                        'Hit Update Permission fn and fix in state',
                                                    );
                                                    updateSelectedUsers(
                                                        [user],
                                                        permissionMapper[
                                                            e.target.value
                                                        ],
                                                    );
                                                }}
                                            >
                                                <RadioGroup.Item
                                                    value="Author"
                                                    label="Author"
                                                />
                                                <RadioGroup.Item
                                                    value="Editor"
                                                    label="Editor"
                                                />
                                                <RadioGroup.Item
                                                    value="Read-Only"
                                                    label="Read-Only"
                                                />
                                            </RadioGroup>
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            Not Available
                                        </MuiTable.Cell>
                                        <MuiTable.Cell>
                                            <IconButton
                                                onClick={() => {
                                                    // set user
                                                    setUserToDelete(user);
                                                    // open modal
                                                    setDeleteMemberModal(true);
                                                }}
                                            >
                                                <Delete></Delete>
                                            </IconButton>
                                        </MuiTable.Cell>
                                    </MuiTable.Row>
                                );
                            })}
                        </MuiTable.Body>
                        <MuiTable.Footer>
                            <MuiTable.Row>
                                <MuiTable.Pagination
                                    rowsPerPageOptions={
                                        paginationOptions.membersPageCounts
                                    }
                                    onPageChange={(e, v) => {
                                        setMembersPage(v + 1);
                                        setSelectedMembers([]);
                                    }}
                                    page={membersPage - 1}
                                    rowsPerPage={5}
                                    count={filteredMembersCount}
                                />
                            </MuiTable.Row>
                        </MuiTable.Footer>
                    </StyledMemberTable>
                </StyledTableContainer>
            </StyledMemberInnerContent>
            <Modal open={deleteMembersModal}>
                <Modal.Title>Are you sure?</Modal.Title>
                <Modal.Content>
                    Would you like to delete all selected members
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteMembersModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        color="error"
                        onClick={() => {
                            deleteSelectedMembers(selectedMembers);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>
            <Modal open={deleteMemberModal} maxWidth="md">
                <Modal.Title>
                    <Typography variant="h6">Are you sure?</Typography>
                </Modal.Title>
                <Modal.Content>
                    <Modal.ContentText>
                        {userToDelete && (
                            <Typography variant="body1">
                                This will remove <b>{userToDelete.name}</b> from
                                the {type}
                            </Typography>
                        )}
                    </Modal.ContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setDeleteMemberModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        color="error"
                        variant={'contained'}
                        onClick={() => {
                            if (!userToDelete) {
                                console.error('No user to delete');
                            }
                            deleteSelectedMembers([userToDelete]);
                        }}
                    >
                        Confirm
                    </Button>
                </Modal.Actions>
            </Modal>

            <Modal open={addMembersModal} maxWidth="md">
                <Modal.Title>Add members to {type}</Modal.Title>
                <Modal.Content sx={{ width: '50rem' }}>
                    <StyledModalContentText>
                        <Autocomplete
                            multiple={true}
                            options={nonCredentialedUsers}
                            value={selectedNonCredentialedUsers}
                            getOptionLabel={(option: any) => {
                                return `${option.name} - ${option.email}`;
                            }}
                            isOptionEqualToValue={(option, value) => {
                                return option.name === value.name;
                            }}
                            onChange={(event, newValue: any) => {
                                setSelectedNonCredentialedUsers([...newValue]);
                            }}
                        ></Autocomplete>

                        <div>
                            <RadioGroup
                                label={
                                    'Please select what role you would like members to have'
                                }
                                onChange={(e) => {
                                    setAddMemberRole(e.target.value);
                                }}
                            >
                                <RadioGroup.Item
                                    value="Author"
                                    label="Author"
                                />
                                <RadioGroup.Item
                                    value="Editor"
                                    label="Editor"
                                />
                                <RadioGroup.Item
                                    value="Read-Only"
                                    label="Read-Only"
                                />
                            </RadioGroup>
                        </div>
                    </StyledModalContentText>
                </Modal.Content>
                <Modal.Actions>
                    <Button
                        variant="text"
                        onClick={() => setAddMembersModal(false)}
                    >
                        Close
                    </Button>
                    <Button
                        variant={'contained'}
                        disabled={
                            !addMemberRole ||
                            selectedNonCredentialedUsers.length < 1
                        }
                        onClick={() => {
                            submitNonCredUsers();
                        }}
                    >
                        Submit
                    </Button>
                </Modal.Actions>
            </Modal>
        </StyledMemberContent>
    );
};
