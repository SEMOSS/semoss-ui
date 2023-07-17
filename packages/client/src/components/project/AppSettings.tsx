import React, { useEffect } from 'react';
import { Avatar, Button, Table, Typography, styled } from '@semoss/ui';
import { Person } from '@mui/icons-material';
import { usePixel } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledAppSettings = styled('div')({
    width: '100%',
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

const StyledTableRow = styled(Table.Row)({
    borderLeft: 'solid red',
    borderRight: 'solid red',

    '&:first-child': {
        borderTop: 'solid yellow',
    },
    '&:last-child': {
        borderBottom: 'solid yellow',
    },
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
            <div></div>
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
                                                <Person />
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
