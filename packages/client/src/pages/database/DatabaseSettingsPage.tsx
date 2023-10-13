import { styled } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';

import { SettingsContext } from '@/contexts';
import { UpdateSMSS } from '@/components/database';
import {
    MembersTable,
    PendingMembersTable,
    SettingsTiles,
} from '@/components/settings';
import { useEngine } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

export const DatabaseSettingsPage = () => {
    const { id, type } = useEngine();
    const navigate = useNavigate();

    return (
        <SettingsContext.Provider
            value={{
                adminMode: false,
            }}
        >
            <StyledContainer>
                <SettingsTiles
                    mode="engine"
                    name={type}
                    id={id}
                    onDelete={() => {
                        navigate('/catalog');
                    }}
                />
                <PendingMembersTable mode={'engine'} id={id} />
                <MembersTable mode={'engine'} id={id} />
                <UpdateSMSS id={id} />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
