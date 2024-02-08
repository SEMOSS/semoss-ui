import { useEffect, useState } from 'react';
import { styled, Button, Menu, MenuProps, List, TextField } from '@semoss/ui';
import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks, usePixel } from '@/hooks';
import { QueryImportCellDef } from './config';
import {
    AccountTree,
    CropFree,
    DriveFileRenameOutline,
    KeyboardArrowDown,
} from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledButtonLabel = styled('span', {
    shouldForwardProp: (prop) => prop !== 'width',
})<{ width: number }>(({ theme, width }) => ({
    width: theme.spacing(width),
    display: 'block',
    textAlign: 'start',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}));

const StyledMenu = styled((props: MenuProps) => (
    <Menu
        anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
        }}
        transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
        }}
        {...props}
    />
))(({ theme }) => ({
    '& .MuiPaper-root': {
        marginTop: theme.spacing(1),
    },
}));

const FrameTypes = {
    GRID: {
        value: 'GRID',
        display: 'Grid',
    },
    R: {
        value: 'R',
        display: 'R',
    },
    PY: {
        value: 'PY',
        display: 'Python',
    },
};

export const QueryImportCellTitle: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell } = props;
    const { state } = useBlocks();
    const [menuType, setMenuType] = useState<'database' | 'frame' | 'variable'>(
        null,
    );
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
        loading: false,
        ids: [],
        display: {},
    });
    const myDbs = usePixel<{ app_id: string; app_name: string }[]>(
        `MyEngines(engineTypes=['DATABASE']);`,
    );
    useEffect(() => {
        if (myDbs.status !== 'SUCCESS') {
            return;
        }

        let dbIds: string[] = [];
        let dbDisplay = {};
        myDbs.data.forEach((db) => {
            dbIds.push(db.app_id);
            dbDisplay[db.app_id] = db.app_name;
        });
        setCfgLibraryDatabases({
            loading: false,
            ids: dbIds,
            display: dbDisplay,
        });

        if (!cell.cellType.parameters.databaseId && dbIds.length) {
            state.dispatch({
                message: ActionMessages.UPDATE_CELL,
                payload: {
                    queryId: cell.query.id,
                    cellId: cell.id,
                    path: 'parameters.databaseId',
                    value: dbIds[0],
                },
            });
        }
    }, [myDbs.status, myDbs.data]);

    return (
        <>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                disableElevation
                disabled={cell.isLoading}
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setMenuType('database');
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<AccountTree />}
                endIcon={<KeyboardArrowDown />}
            >
                <StyledButtonLabel width={8}>
                    {cfgLibraryDatabases.display[
                        cell.parameters.databaseId as string
                    ] ?? ''}
                </StyledButtonLabel>
            </StyledButton>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                disableElevation
                disabled={cell.isLoading}
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setMenuType('frame');
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<CropFree />}
                endIcon={<KeyboardArrowDown />}
            >
                <StyledButtonLabel width={6}>
                    {FrameTypes[cell.parameters.frameType]?.display ?? ''}
                </StyledButtonLabel>
            </StyledButton>
            <StyledButton
                aria-haspopup="true"
                aria-expanded={open ? 'true' : undefined}
                variant="outlined"
                disableElevation
                disabled={cell.isLoading}
                size="small"
                onClick={(event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault();
                    setMenuType('variable');
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<DriveFileRenameOutline />}
            >
                <StyledButtonLabel width={6}>
                    {cell.parameters.frameVariableName ?? ''}
                </StyledButtonLabel>
            </StyledButton>
            <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
                {menuType === 'database' &&
                    Array.from(cfgLibraryDatabases.ids, (databaseId) => (
                        <List disablePadding dense>
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${databaseId}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.databaseId',
                                                value: databaseId,
                                            },
                                        });
                                        handleClose();
                                    }}
                                >
                                    <List.ItemText
                                        primary={
                                            cfgLibraryDatabases.display[
                                                databaseId
                                            ] ?? ''
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        </List>
                    ))}
                {menuType === 'frame' &&
                    Array.from(Object.values(FrameTypes), (frameType) => (
                        <List disablePadding dense>
                            <List.Item
                                disablePadding
                                key={`${cell.id}-${frameType}`}
                            >
                                <List.ItemButton
                                    onClick={() => {
                                        state.dispatch({
                                            message: ActionMessages.UPDATE_CELL,
                                            payload: {
                                                queryId: cell.query.id,
                                                cellId: cell.id,
                                                path: 'parameters.frameType',
                                                value: frameType.value,
                                            },
                                        });
                                        handleClose();
                                    }}
                                >
                                    <List.ItemText
                                        primary={frameType.display}
                                    />
                                </List.ItemButton>
                            </List.Item>
                        </List>
                    ))}
                {menuType === 'variable' && (
                    <TextField
                        value={cell.parameters.frameVariableName}
                        size="small"
                        label="Output Variable Name"
                        onChange={(value) => {
                            state.dispatch({
                                message: ActionMessages.UPDATE_CELL,
                                payload: {
                                    queryId: cell.query.id,
                                    cellId: cell.id,
                                    path: 'parameters.frameVariableName',
                                    value: value,
                                },
                            });
                            handleClose();
                        }}
                    />
                )}
            </StyledMenu>
        </>
    );
};
