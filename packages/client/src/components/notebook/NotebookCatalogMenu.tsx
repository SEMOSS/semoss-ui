import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
    styled,
    Button,
    IconButton,
    List,
    Menu,
    Typography,
    Stack,
    useNotification,
    Tooltip,
} from '@semoss/ui';
import { useBlocks, useRootStore, usePixel } from '@/hooks';
import { Search, MoreVert, VisibilityRounded } from '@mui/icons-material';
import { AddTokenModal } from './AddTokenModal';
import { ActionMessages } from '@/stores';
import { BlocksRenderer } from '../blocks-workspace';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    paddingTop: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
}));

const StyledMenuTitle = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledMenuScroll = styled('div')(({ theme }) => ({
    flex: '1',
    width: '100%',
    paddingBottom: theme.spacing(1),
    overflowX: 'hidden',
    overflowY: 'auto',
}));

export const NotebookCatalogMenu = observer(() => {
    const { state, notebook } = useBlocks();

    const getEngines = usePixel<
        { app_id: string; app_name: string; app_type: string }[]
    >(`
    MyEngines();
    `);

    const [engines, setEngines] = useState({
        models: [],
        databases: [],
        storages: [],
    });

    useEffect(() => {
        if (getEngines.status !== 'SUCCESS') {
            return;
        }
        const cleanedEngines = getEngines.data.map((d) => ({
            app_name: d.app_name ? d.app_name.replace(/_/g, ' ') : '',
            app_id: d.app_id,
            app_type: d.app_type,
        }));

        const newEngines = {
            models: cleanedEngines.filter((e) => e.app_type === 'MODEL'),
            databases: cleanedEngines.filter((e) => e.app_type === 'DATABASE'),
            storages: cleanedEngines.filter((e) => e.app_type === 'STORAGE'),
        };
        setEngines(newEngines);
    }, [getEngines.status, getEngines.data]);

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <Stack direction="row" justifyContent="space-between">
                    <StyledMenuTitle variant="h6">Catalog</StyledMenuTitle>
                </Stack>
            </Stack>
            <StyledMenuScroll>
                <List disablePadding>
                    {engines.databases.map((db, index) => {
                        return (
                            <List.Item key={db.app_id} disablePadding>
                                <List.ItemButton
                                    onClick={() => {
                                        // Create a Hidden Engine Block to be able to directly reference
                                        // add as a dependency
                                        // state.dispatch({
                                        //     message: ActionMessages.ADD_BLOCK,
                                        //     payload: {
                                        //         json: {
                                        //             data: {
                                        //                 value: db.app_id
                                        //             },
                                        //             widget: 'ENGINE'
                                        //         },
                                        //         position: {
                                        //             parent: null,
                                        //             slot: null,
                                        //         },
                                        //     },
                                        // });
                                    }}
                                >
                                    <List.ItemText
                                        disableTypography
                                        primary={
                                            <Typography variant="subtitle2">
                                                {db.app_name}
                                            </Typography>
                                        }
                                    />
                                </List.ItemButton>
                            </List.Item>
                        );
                    })}
                </List>
            </StyledMenuScroll>
        </StyledMenu>
    );
});
