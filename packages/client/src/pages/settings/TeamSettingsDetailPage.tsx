import { useLocation } from 'react-router-dom';
import { styled } from '@semoss/ui';

import {
    TeamMembersTable,
    TeamProjectsTable,
    TeamEnginesTable,
} from '@/components/settings';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexShrink: '0',
}));

export const TeamSettingsDetailPage = () => {
    const { state } = useLocation();

    return (
        <StyledContainer>
            <StyledContent>
                <TeamMembersTable groupId={state.name} name="MEMBERS" />
                <TeamProjectsTable
                    groupId={state.name}
                    groupType={state.type}
                    name="PROJECTS"
                />
                <TeamEnginesTable
                    groupId={state.name}
                    groupType={state.type}
                    name="ENGINES"
                />
            </StyledContent>
        </StyledContainer>
    );
};
