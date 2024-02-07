import { useEffect, useState } from 'react';
import { styled, Button, Menu, MenuProps, List } from '@semoss/ui';
import { ActionMessages, CellComponent } from '@/stores';
import { useBlocks, usePixel } from '@/hooks';
import { QueryImportCellDef } from './config';
import { AccountTree, KeyboardArrowDown } from '@mui/icons-material';

const StyledButton = styled(Button)(({ theme }) => ({
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.text.secondary}`,
}));

const StyledButtonLabel = styled('span')(({ theme }) => ({
    width: theme.spacing(8),
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

export const QueryImportCellTitle: CellComponent<QueryImportCellDef> = (
    props,
) => {
    const { cell } = props;
    const { state } = useBlocks();
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
                    setAnchorEl(event.currentTarget);
                }}
                startIcon={<AccountTree />}
                endIcon={<KeyboardArrowDown />}
            >
                <StyledButtonLabel>
                    {cfgLibraryDatabases.display[
                        cell.parameters.databaseId as string
                    ] ?? ''}
                </StyledButtonLabel>
            </StyledButton>
            <StyledMenu anchorEl={anchorEl} open={open} onClose={handleClose}>
                <List disablePadding dense>
                    {Array.from(cfgLibraryDatabases.ids, (databaseId) => (
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
                    ))}
                </List>
            </StyledMenu>
        </>
    );
};
