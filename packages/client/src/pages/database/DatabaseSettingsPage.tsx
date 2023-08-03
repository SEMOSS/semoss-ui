import {
    MembersTable,
    PendingMembersTable,
    UpdateSMSS,
    WorkflowAccess,
} from '@/components/database';
import { useDatabase } from '@/hooks';
import { styled } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    // padding: `${theme.spacing(3)} ${theme.spacing(2)}`,
}));

export const DatabaseSettingsPage = () => {
    const { id } = useDatabase();
    const navigate = useNavigate();

    return (
        <StyledContainer>
            <WorkflowAccess
                type={'database'}
                id={id}
                projectId={undefined}
                onDelete={() => {
                    console.log('navigate to catalog');
                    navigate('/catalog');
                }}
            />
            <PendingMembersTable
                type={'database'}
                name={'name'}
                adminMode={true}
                id={id}
                projectId={undefined}
            />
            <MembersTable
                type={'database'}
                name={'name'}
                adminMode={true}
                id={id}
                projectId={undefined}
            />
            <UpdateSMSS id={id} />
        </StyledContainer>
    );
};
