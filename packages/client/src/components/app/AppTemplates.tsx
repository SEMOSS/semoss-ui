import { useState } from 'react';
import { styled, Stack, Typography, Grid, List } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@mui/icons-material';

const StyledFilter = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 'fit-content',
    width: '352px',
    paddingBottom: theme.spacing(2.75),
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
    background: theme.palette.background.paper,
}));

const StyledFilterList = styled(List)(({ theme }) => ({
    width: '100%',
    borderRadius: theme.shape.borderRadius,
    gap: theme.spacing(2),
}));

export const AppTemplates = () => {
    const navigate = useNavigate();

    const [isFilterOpen, setIsFilterOpen] = useState(true);

    /**
     * Navigate to the app and open it
     *
     * appId - appId of the app
     */
    const navigateApp = (appId: string) => {
        if (!appId) {
            return;
        }

        navigate(`${appId}`);
    };

    return (
        <Stack
            direction={'row'}
            alignItems={'flex-start'}
            alignSelf={'stretch'}
            spacing={3}
        >
            <StyledFilter>
                <StyledFilterList dense={true}>
                    <List.Item
                        secondaryAction={
                            <List.ItemButton
                                onClick={() => {
                                    setIsFilterOpen(!isFilterOpen);
                                }}
                            >
                                {isFilterOpen ? <ExpandLess /> : <ExpandMore />}
                            </List.ItemButton>
                        }
                    >
                        <List.ItemText
                            disableTypography
                            primary={
                                <Typography variant="h6">Filter By</Typography>
                            }
                        />
                    </List.Item>
                </StyledFilterList>
            </StyledFilter>

            <Stack direction="row">
                <Grid container spacing={3}>
                    <Grid item sm={12} md={6} lg={4} xl={4}>
                        Hello
                    </Grid>
                </Grid>
            </Stack>
        </Stack>
    );
};
