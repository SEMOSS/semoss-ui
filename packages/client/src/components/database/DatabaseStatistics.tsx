import {
    Card,
    Grid,
    Icon,
    styled,
    Typography,
    CustomPaletteOptions,
} from '@/component-library';

import {
    AutoGraph,
    Star,
    DownloadForOffline,
    RemoveRedEyeOutlined,
} from '@mui/icons-material';

import { usePixel } from '@/hooks';

const StyledCard = styled(Card)(({ theme }) => ({
    borderRadius: '12px',
    background: theme.palette.background.paper,
    boxShadow: `0px 4px 4px 0px rgba(0, 0, 0, 0.04)`,
}));

const StyledCardImageContainer = styled('div')(({ theme }) => {
    // TODO: Fix typing
    const palette = theme.palette as CustomPaletteOptions;

    return {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: theme.spacing(7.5),
        height: theme.spacing(7.5),
        borderRadius: theme.spacing(0.75),
        backgroundColor: palette.primaryContrast['50'],
    };
});

const StyledCardContent = styled('div')(({ theme }) => ({
    gap: '10px',
    display: 'flex',
    alignItems: 'center',
    alignSelf: 'stretch',
    padding: theme.spacing(2),
}));

const StyledCardDetailsContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    flex: '1 0 0',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(0.5),
}));

interface DatabaseStatisticsProps {
    id: string;
}

export const DatabaseStatistics = (props: DatabaseStatisticsProps) => {
    const { id } = props;

    const { status, data } = usePixel<
        | {
              totalUses: number;
              totalViews: number;
              usabilityScore: number;
              usedIn: unknown[];
              usesByDate: Record<string, unknown>;
              viewsByDate: Record<string, unknown>;
          }
        | false
    >(`EngineActivity(engine='${id}');`);

    if (!data) {
        return null;
    }

    if (status === 'ERROR') {
        return <div>Error</div>;
    } else if (status !== 'SUCCESS') {
        return <div>Loading</div>;
    }

    return (
        <Grid container spacing={3}>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <StyledCard>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <RemoveRedEyeOutlined />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Views</Typography>
                            <Typography variant="caption">
                                {data.totalViews}
                            </Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </StyledCard>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <StyledCard>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <DownloadForOffline />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Downloads</Typography>
                            <Typography variant="caption">N/A</Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </StyledCard>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <StyledCard>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <AutoGraph />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Insights</Typography>
                            <Typography variant="caption">
                                {data.usedIn.length}
                            </Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </StyledCard>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <StyledCard>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <Star />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Usability</Typography>
                            <Typography variant="caption">
                                {data.usabilityScore}/10
                            </Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </StyledCard>
            </Grid>
        </Grid>
    );
};
