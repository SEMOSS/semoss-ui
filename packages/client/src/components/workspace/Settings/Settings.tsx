import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { Tooltip, styled, List, Stack, Typography } from '@semoss/ui';
import { Sidebar, SidebarItem, SidebarText } from '@/components/common';
import { SettingsView } from './SettingsView';
import {
    SupervisorAccount,
    // ModelTraining,
    // AutoGraphRounded,
    // CompareArrowsRounded,
    // HistoryRounded,
    // TuneRounded,
} from '@mui/icons-material';

const StyledSettings = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'row',
    position: 'relative',
    height: '100%',
    width: '100%',
    overflow: 'hidden',
}));

// const StyledLeftPanel = styled('div')(({ theme }) => ({
//     height: '100%',
//     width: theme.spacing(45),
//     overflow: 'hidden',
//     backgroundColor: theme.palette.background.paper,
//     borderRight: `1px solid ${theme.palette.divider}`,
// }));

const StyledCenterPanel = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
}));

// const StyledMenu = styled('div')(({ theme }) => ({
//     display: 'flex',
//     flexDirection: 'column',
//     height: '100%',
//     width: '100%',
//     padding: `${theme.spacing(1)} 0`,
//     backgroundColor: theme.palette.background.paper,
// }));

// const StyledMenuTitle = styled(Typography)(() => ({
//     fontWeight: 'bold',
// }));

// const StyledListItem = styled(List.Item)<{ selected?: boolean }>(
//     ({ theme, selected }) => ({
//         padding: theme.spacing(2),
//         '&:hover': {
//             backgroundColor: theme.palette.primary.selected,
//         },

//         ...(selected && {
//             backgroundColor: theme.palette.primary.selected,
//         }),
//     }),
// );

export const Settings = observer(() => {
    const [view, setView] = useState<'access' | 'testing' | ''>('access');
    // const [subView, setSubView] = useState<
    //     'configure' | 'testing' | 'analyze' | 'history' | ''
    // >('configure');

    const updateView = (v: typeof view) => {
        if (!v || v === view) {
            setView('');
            return;
        }

        setView(v);
    };

    // const updateSubView = (v: typeof subView) => {
    //     if (!v) {
    //         setSubView('');
    //         return;
    //     }

    //     setSubView(v);
    // };

    return (
        <StyledSettings>
            <Sidebar>
                <SidebarItem
                    selected={view === 'access'}
                    onClick={() => updateView('access')}
                >
                    <Tooltip title="Access" placement="right">
                        <SupervisorAccount color="inherit" />
                    </Tooltip>
                    <SidebarText>Access</SidebarText>
                </SidebarItem>
            </Sidebar>

            {/* {view === 'testing' && subView !== 'testing' && (
                <StyledLeftPanel>
                    <StyledMenu>
                        <Stack spacing={2} padding={2}>
                            <StyledMenuTitle variant="h6">
                                Model Comparison Testing
                            </StyledMenuTitle>
                        </Stack>

                        <List>
                            <StyledListItem
                                alignItems="flex-start"
                                selected={subView === 'configure'}
                                onClick={() => updateSubView('configure')}
                            >
                                <List.Icon>
                                    <TuneRounded color="inherit" />
                                </List.Icon>
                                <List.ItemText>Configure</List.ItemText>
                            </StyledListItem>
                            <StyledListItem
                                alignItems="flex-start"
                                onClick={() => updateSubView('testing')}
                            >
                                <List.Icon>
                                    <CompareArrowsRounded color="inherit" />
                                </List.Icon>
                                <List.ItemText>A/B Testing</List.ItemText>
                            </StyledListItem>
                            <StyledListItem
                                alignItems="flex-start"
                                selected={subView === 'analyze'}
                                onClick={() => updateSubView('analyze')}
                            >
                                <List.Icon>
                                    <AutoGraphRounded color="inherit" />
                                </List.Icon>
                                <List.ItemText>Analyze</List.ItemText>
                            </StyledListItem>
                            <StyledListItem
                                alignItems="flex-start"
                                selected={subView === 'history'}
                                onClick={() => updateSubView('history')}
                            >
                                <List.Icon>
                                    <HistoryRounded color="inherit" />
                                </List.Icon>
                                <List.ItemText>History</List.ItemText>
                            </StyledListItem>
                        </List>
                    </StyledMenu>
                </StyledLeftPanel>
            )} */}

            <StyledCenterPanel>
                {view === 'access' && <SettingsView />}
            </StyledCenterPanel>
        </StyledSettings>
    );
});
