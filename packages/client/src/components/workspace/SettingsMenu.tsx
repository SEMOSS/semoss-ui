import { observer } from 'mobx-react-lite';
import { styled, Stack, Typography } from '@semoss/ui';

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

export const SettingsMenu = observer((): JSX.Element => {
    return (
        <StyledMenu>
            <Stack spacing={2} padding={2}>
                <StyledMenuTitle variant="h6">
                    Model Comparison Testing
                </StyledMenuTitle>
            </Stack>
        </StyledMenu>
    );
});
