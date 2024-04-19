import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { styled, Stack, Typography, List } from '@semoss/ui';
import {
    AutoGraphRounded,
    CompareArrowsRounded,
    HistoryRounded,
    TuneRounded,
} from '@mui/icons-material';

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    padding: `${theme.spacing(1)} 0`,
    backgroundColor: theme.palette.background.paper,
}));

const StyledMenuTitle = styled(Typography)(() => ({
    fontWeight: 'bold',
}));

const StyledListItem = styled(List.Item)<{ selected?: boolean }>(
    ({ theme, selected }) => ({
        padding: theme.spacing(2),
        '&:hover': {
            backgroundColor: theme.palette.primary.selected,
        },

        ...(selected && {
            backgroundColor: theme.palette.primary.selected,
        }),
    }),
);

export const SettingsMenu = observer((): JSX.Element => {
    const [view, setView] = useState<
        'configure' | 'testing' | 'analyze' | 'history' | ''
    >('configure');

    const updateView = (v: typeof view) => {
        if (!v || v === view) {
            setView('');
            return;
        }

        setView(v);
    };

    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <StyledMenuTitle variant="h6">
                    Model Comparison Testing
                </StyledMenuTitle>
            </Stack>

            <List>
                <StyledListItem
                    alignItems="flex-start"
                    selected={view === 'configure'}
                    onClick={() => updateView('configure')}
                >
                    <List.Icon>
                        <TuneRounded color="inherit" />
                    </List.Icon>
                    <List.ItemText>Configure</List.ItemText>
                </StyledListItem>
                <StyledListItem
                    alignItems="flex-start"
                    selected={view === 'testing'}
                    onClick={() => updateView('testing')}
                >
                    <List.Icon>
                        <CompareArrowsRounded color="inherit" />
                    </List.Icon>
                    <List.ItemText>A/B Testing</List.ItemText>
                </StyledListItem>
                <StyledListItem
                    alignItems="flex-start"
                    selected={view === 'analyze'}
                    onClick={() => updateView('analyze')}
                >
                    <List.Icon>
                        <AutoGraphRounded color="inherit" />
                    </List.Icon>
                    <List.ItemText>Analyze</List.ItemText>
                </StyledListItem>
                <StyledListItem
                    alignItems="flex-start"
                    selected={view === 'history'}
                    onClick={() => updateView('history')}
                >
                    <List.Icon>
                        <HistoryRounded color="inherit" />
                    </List.Icon>
                    <List.ItemText>History</List.ItemText>
                </StyledListItem>
            </List>
        </StyledMenu>
    );
});
