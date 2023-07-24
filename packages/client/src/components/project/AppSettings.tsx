import React, { useEffect } from 'react';
import {
    Alert,
    Avatar,
    Button,
    Table,
    Typography,
    Switch,
    styled,
} from '@semoss/ui';
import { Person, ToggleOffRounded } from '@mui/icons-material';
import { usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledAppSettings = styled('div')({
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '1rem',
});

const StyledCardContainer = styled('div')({
    width: '100%',
    gap: '16px',
    display: 'flex',
    background: '#FFF',
    alignSelf: 'stretch',
    borderRadius: '12px',
    alignItems: 'flex-start',
    boxShadow: '0px 5px 22px 0px rgba(0, 0, 0, 0.06)',
});

const StyledCardDiv = styled('div')({
    gap: '16px',
    flex: '1 0 0',
    display: 'flex',
    padding: '16px',
    alignItems: 'flex-start',
});

const StyledCardLeft = styled('div')({
    display: 'flex',
    height: '260px',
    width: '50%',
    gap: '1rem',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledListItemHeader = styled('div')({
    display: 'flex',
    width: '628px',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledListItemSubheader = styled('div')({
    display: 'flex',
    width: '628px',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledLeftActionContainer = styled('div')({
    display: 'flex',
    gap: '4px',
    flex: '1 0 0',
    alignItems: 'flex-end',
    justifyContent: 'center',
});

const StyledLeftActionDiv = styled('div')({
    gap: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledActionDivLeft = styled('div')((theme) => ({
    display: 'flex',
    paddingRight: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
}));

const StyledPersonIcon = styled(Person)({
    display: 'flex',
    alignItems: 'flex-start',
});

const StyledCardRight = styled('div')({
    width: '50%',
});

const StyledCardRightContent = styled('div')({
    display: 'flex',
    gap: '4px',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledCardRightTop = styled('div')({
    display: 'flex',
    padding: '16px',
    width: '100%',
    gap: '16px',
    flex: '1 0 0',
    alignItems: 'flex-start',
});

const StyledEnablePublishLeft = styled('div')({});

const StyledEnablePublishMiddle = styled('div')({});

const StyledEnablePublishRight = styled('div')({});

const StyledCardRightBottom = styled('div')({
    display: 'flex',
    height: '149px',
    width: '100%',
    padding: '6px 0px',
    gap: '18px',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
});

const StyledTableRow = styled(Table.Row)((theme) => ({
    borderLeft: `solid #e0e0e0`,
    borderRight: `solid #e0e0e0`,

    '&:first-child': {
        borderTop: `solid #e0e0e0`,
        borderRadius: 8,
    },
    '&:last-child': {
        borderBottom: `solid #e0e0e0`,
        borderRadius: 8,
    },
}));

const StyledIcon = styled(Person)({
    display: 'flex',
    alignItems: 'flex-start',
    // Needs to reference theme grey
    color: 'rgba(0, 0, 0, 0.54)',
});

export const AppSettings = (props) => {
    const { id } = props;

    const getProjectReactors = usePixel(
        `GetProjectAvailableReactors(project=['${id}']);`,
    );

    useEffect(() => {
        if (
            getProjectReactors.status !== 'SUCCESS' ||
            !getProjectReactors.data
        ) {
            return;
        }
        console.log(getProjectReactors.data);
    }, [getProjectReactors.status, getProjectReactors.data]);

    /** LOADING */
    if (getProjectReactors.status !== 'SUCCESS') {
        return <LoadingScreen.Trigger description="Getting members" />;
    }

    return (
        <StyledAppSettings>
            <StyledCardContainer>
                <StyledCardDiv>
                    <StyledCardLeft>
                        <StyledListItemHeader>
                            <Typography variant="h6">Portal</Typography>
                        </StyledListItemHeader>
                    </StyledCardLeft>
                    <StyledCardRight>
                        <StyledCardRightContent>
                            <StyledCardRightTop>
                                <StyledEnablePublishLeft>
                                    <ToggleOffRounded />
                                </StyledEnablePublishLeft>
                                <StyledEnablePublishMiddle>
                                    <Typography variant={'body2'}>
                                        Enable Publishing
                                    </Typography>
                                    <Typography variant={'caption'}>
                                        Enable the publishing of the portal
                                    </Typography>
                                </StyledEnablePublishMiddle>
                                <StyledEnablePublishRight>
                                    <Switch color="primary" />
                                </StyledEnablePublishRight>
                            </StyledCardRightTop>
                            <StyledCardRightBottom></StyledCardRightBottom>
                        </StyledCardRightContent>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledCardContainer>
            <StyledCardContainer>
                <StyledCardDiv>
                    <StyledCardLeft>
                        <StyledListItemHeader>
                            <Typography variant="h6">Reactors</Typography>
                        </StyledListItemHeader>

                        <StyledListItemSubheader>
                            Custom reactors created for the portal.
                        </StyledListItemSubheader>
                        <Button variant="contained">Recompile</Button>
                        <StyledLeftActionContainer>
                            <StyledLeftActionDiv>
                                <StyledActionDivLeft>
                                    <Typography variant="body2">
                                        Last compiled by:
                                    </Typography>
                                </StyledActionDivLeft>
                                <Avatar>
                                    <StyledPersonIcon />
                                </Avatar>
                                <Typography variant="body2">John</Typography>
                                <Typography variant="body2">
                                    7/17/2023
                                </Typography>
                            </StyledLeftActionDiv>
                        </StyledLeftActionContainer>
                    </StyledCardLeft>
                    <StyledCardRight>
                        <Table>
                            <Table.Body>
                                {getProjectReactors.data.map((reactor, i) => {
                                    return (
                                        <StyledTableRow key={reactor + i}>
                                            <Table.Cell>{reactor}</Table.Cell>
                                            <Table.Cell align="right">
                                                <StyledIcon />
                                            </Table.Cell>
                                        </StyledTableRow>
                                    );
                                })}
                            </Table.Body>
                        </Table>
                    </StyledCardRight>
                </StyledCardDiv>
            </StyledCardContainer>
        </StyledAppSettings>
    );
};
