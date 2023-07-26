import React from 'react';
import {
    MembersTable,
    Permissions,
    PendingMembersTable,
    UpdateSMSS,
} from '@/components/database';
import { useDatabase } from '@/hooks';
import { styled } from '@semoss/ui';

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

    return (
        <StyledContainer>
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
