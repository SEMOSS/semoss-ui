import { Card, Grid, Icon, styled, Typography } from '@semoss/ui';

import {
    Star,
    DownloadForOffline,
    RemoveRedEyeOutlined,
} from '@mui/icons-material';
import { SEMOSS } from '@/assets/img/SEMOSS';

import { usePixel } from '@/hooks';

const StyledCardImageContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: theme.spacing(7.5),
    height: theme.spacing(7.5),
    borderRadius: theme.spacing(0.75),
    backgroundColor: theme.palette.semossBlue['50'],
}));

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

    const {
        status: usabilityStatus,
        data: usabilityData,
        refresh: usabilityRefresh,
    } = usePixel<number>(`UsabilityScore(database = '${id}');`);

    if (usabilityStatus === 'ERROR') {
        return <div>Error</div>;
    }

    return (
        <Grid container spacing={3}>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <Card>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <RemoveRedEyeOutlined />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Views</Typography>
                            <Typography variant="caption">100</Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </Card>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <Card>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <DownloadForOffline />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Downloads</Typography>
                            <Typography variant="caption">100</Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </Card>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <Card>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <SEMOSS width={36} height={40} />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Insights</Typography>
                            <Typography variant="caption">100</Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </Card>
            </Grid>
            <Grid item sm={12} md={6} lg={4} xl={3}>
                <Card>
                    <StyledCardContent>
                        <StyledCardImageContainer>
                            <Icon color="primary">
                                <Star />
                            </Icon>
                        </StyledCardImageContainer>

                        <StyledCardDetailsContainer>
                            <Typography variant="caption">Usability</Typography>
                            <Typography variant="caption">
                                {usabilityData}/10
                            </Typography>
                        </StyledCardDetailsContainer>
                    </StyledCardContent>
                </Card>
            </Grid>
        </Grid>
    );
};
