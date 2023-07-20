import React from 'react';
import { Permissions, UpdateSMSS } from '@/components/database';
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
            <Permissions
                config={{
                    id: id,
                    name: 'get name',
                    global: false,
                }}
            />
            <UpdateSMSS id={id} />
        </StyledContainer>
    );
};
