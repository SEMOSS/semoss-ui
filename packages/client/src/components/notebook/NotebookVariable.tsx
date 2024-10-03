import React, { useState, useRef, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Icon,
    IconButton,
    List,
    Menu,
    Typography,
    Stack,
    useNotification,
    Tooltip,
    TextField,
    LinearProgress,
} from '@semoss/ui';
import { Variable } from '@/stores';
import { ContentCopy, MoreVert, Delete, Edit } from '@mui/icons-material';
import { AddVariablePopover } from './AddVariablePopover';

import { ActionMessages } from '@/stores';
import { useBlocks } from '@/hooks';
import { VariablePreview } from './VariablePreview';

const StyledListItem = styled(List.Item)(() => ({
    '&.MuiListItem-root': {
        paddingTop: '0px',
        paddingBottom: '0px',
    },
}));

const StyledTooltip = styled(Tooltip)(() => ({
    fontWeight: 'bold',
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
    '&.MuiLinearProgress-root': {
        height: '2px',
        backgroundColor: 'transparent',
        marginTop: '21px',
        '.MuiLinearProgress-barColorDeterminate': {},
    },
}));

const StyledButton = styled('button')(({ theme }) => ({
    border: 'none',
    background: 'none',
    padding: 0,
    margin: 0,
    outline: 'none',
    width: '100%',
    display: 'flex',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledPointerStack = styled(Stack)(({ theme }) => ({
    width: '80%',
    overflow: 'scroll',
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledListItemText = styled(List.ItemText)(({ theme }) => ({
    // May not actually be needed, browser was being weird
    '&:hover': {
        cursor: 'pointer',
    },
}));

const StyledIcon = styled(Icon)(({ theme }) => ({
    color: 'rgb(0,0,0)',
}));

const StyledErrorTypography = styled(Typography)(({ theme }) => ({
    color: theme.palette.error.main,
}));

const StyledCapitalizedTypography = styled(Typography)(() => ({
    textTransform: 'capitalize',
}));

const StyledAnchorSpan = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 100,
}));

const StyledStack = styled(Stack)(({ theme }) => ({
    width: '80%',
}));

const StyledTextField = styled(TextField)(() => ({
    padding: '0px',
}));

interface NotebookTokenProps {
    /** Id of the variable */
    id: string;
    /** Variable Value */
    variable: Variable;
    /** Engines loaded in root variable menu */
    engines: {
        models: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        databases: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        storages: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        functions: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
        vectors: {
            app_id: string;
            app_name: string;
            app_type: string;
            app_subtype: string;
        }[];
    };
}

export const NotebookVariable = observer((props: NotebookTokenProps) => {
    const { id, variable, engines } = props;
    const { state } = useBlocks();
    const notification = useNotification();

    const [openRenameAlias, setOpenRenameAlias] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [newTokenAlias, setNewTokenAlias] = useState(id);
    const [popoverAnchorEle, setPopoverAnchorEl] = useState<HTMLElement | null>(
        null,
    );
    const isPopoverOpen = Boolean(popoverAnchorEle);

    const spanRef = useRef();
    /**
     * Copys the alias to use in notebook
     * @param alias
     */
    const copyAlias = (alias: string) => {
        try {
            navigator.clipboard.writeText(`{{${alias}}}`);

            notification.add({
                color: 'success',
                message: 'Succesfully copied to clipboard',
            });
        } catch (e) {
            notification.add({
                color: 'error',
                message: e.message,
            });
        }
    };

    /**
     * Effects/Memos
     */
    const getVariableTypeDisplay: string = useMemo(() => {
        if (
            variable.type !== 'query' &&
            variable.type !== 'block' &&
            variable.type !== 'cell'
        ) {
            const engineId = state.getVariable(variable.to, variable.type);
            const engine = engines[`${variable.type}s`]
                ? engines[`${variable.type}s`].find(
                      (engineValue) => engineValue.app_id === engineId,
                  )
                : null;
            if (engine) {
                return engine.app_name;
            } else {
                return variable.type;
            }
        } else {
            return variable.type;
        }
    }, [
        variable.type,
        engines,
        id,
        Object.values(state.dependencies).join(''),
    ]);

    return (
        <StyledListItem
            key={id}
            secondaryAction={
                <>
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        paddingY="8px"
                    >
                        <IconButton
                            onClick={() => {
                                copyAlias(id);
                                setAnchorEl(null);
                            }}
                        >
                            <ContentCopy />
                        </IconButton>
                        <IconButton
                            title="Open Menu"
                            onClick={(e) => {
                                e.preventDefault();
                                setAnchorEl(e.currentTarget);
                            }}
                        >
                            <MoreVert />
                        </IconButton>
                        <StyledAnchorSpan ref={spanRef} />
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => {
                                setAnchorEl(null);
                            }}
                        >
                            <Menu.Item
                                value="Edit"
                                onClick={(e) => {
                                    setPopoverAnchorEl(spanRef.current);
                                    setAnchorEl(null);
                                }}
                            >
                                <Stack direction="row" alignItems="center">
                                    <StyledIcon color="secondary">
                                        <Edit />
                                    </StyledIcon>
                                    <Typography variant="body2">
                                        Edit
                                    </Typography>
                                </Stack>
                            </Menu.Item>
                            <Menu.Item
                                value="Delete"
                                onClick={() => {
                                    state.dispatch({
                                        message: ActionMessages.DELETE_VARIABLE,
                                        payload: {
                                            id: id,
                                        },
                                    });

                                    notification.add({
                                        color: 'warning',
                                        message: `Successfully deleted ${id}, please be aware this likely will affect your data notebook.`,
                                    });

                                    setAnchorEl(null);
                                }}
                            >
                                <Stack direction="row" alignItems="center">
                                    <Delete color="error" />
                                    <StyledErrorTypography variant="body2">
                                        Delete
                                    </StyledErrorTypography>
                                </Stack>
                            </Menu.Item>
                        </Menu>
                    </Stack>
                </>
            }
        >
            <StyledListItemText
                disableTypography
                primary={
                    <Stack>
                        <StyledTooltip
                            placement={'right'}
                            title={
                                <VariablePreview variable={variable} id={id} />
                            }
                            componentsProps={{
                                tooltip: {
                                    sx: {
                                        bgcolor: 'white',
                                        color: 'black',
                                        padding: '0px',
                                        maxWidth: '600px',
                                    },
                                },
                            }}
                            enterDelay={500}
                            leaveDelay={200}
                        >
                            <StyledButton>
                                {!openRenameAlias ? (
                                    <StyledPointerStack
                                        alignItems="flex-start"
                                        spacing={0}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();

                                            setOpenRenameAlias(true);
                                        }}
                                    >
                                        <Typography
                                            variant="body1"
                                            fontWeight="medium"
                                        >
                                            {id}
                                        </Typography>
                                        <StyledCapitalizedTypography variant="body2">
                                            {getVariableTypeDisplay}
                                        </StyledCapitalizedTypography>
                                    </StyledPointerStack>
                                ) : (
                                    <StyledStack spacing={1} direction="column">
                                        <StyledTextField
                                            className="notebook-variable__alias-name-text-field"
                                            inputRef={(input) =>
                                                input && input.focus()
                                            }
                                            focused={true}
                                            fullWidth
                                            size={'small'}
                                            variant="standard"
                                            value={newTokenAlias}
                                            helperText={
                                                <em>
                                                    Press enter to update
                                                    variable name
                                                </em>
                                            }
                                            onChange={(e) => {
                                                setNewTokenAlias(
                                                    e.target.value,
                                                );
                                            }}
                                            onKeyDown={async (e) => {
                                                if (e.key === 'Enter') {
                                                    setOpenRenameAlias(false);

                                                    const success =
                                                        await state.dispatch({
                                                            message:
                                                                ActionMessages.RENAME_VARIABLE,
                                                            payload: {
                                                                id: id,
                                                                alias: newTokenAlias,
                                                            },
                                                        });

                                                    notification.add({
                                                        color: success
                                                            ? 'success'
                                                            : 'error',
                                                        message: success
                                                            ? `Succesfully renamed variable ${id} to ${newTokenAlias}, remember to save your app.`
                                                            : `Unable to rename ${id} to ${newTokenAlias}, due to syntax or a duplicated alias`,
                                                    });

                                                    setNewTokenAlias(
                                                        success
                                                            ? newTokenAlias
                                                            : id,
                                                    );
                                                }
                                            }}
                                            onBlur={() => {
                                                setOpenRenameAlias(false);
                                                setNewTokenAlias(id);
                                            }}
                                            InputProps={{
                                                disableUnderline: true,
                                            }}
                                        />
                                    </StyledStack>
                                )}
                                {isPopoverOpen && (
                                    <div
                                        onMouseOver={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                        onMouseLeave={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                        }}
                                    >
                                        <AddVariablePopover
                                            variable={{
                                                ...variable,
                                                id: id,
                                            }}
                                            open={isPopoverOpen}
                                            anchorEl={popoverAnchorEle}
                                            onClose={() => {
                                                setPopoverAnchorEl(null);
                                            }}
                                            engines={engines}
                                        />
                                    </div>
                                )}
                            </StyledButton>
                        </StyledTooltip>
                    </Stack>
                }
            />
        </StyledListItem>
    );
});
