import { styled } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';

import { SettingsContext } from '@/contexts';
import { UpdateSMSS } from '@/components/database';
import {
    MembersTable,
    PendingMembersTable,
    SettingsTiles,
} from '@/components/settings';
import { useDatabase } from '@/hooks';

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
    const { id, type, role } = useDatabase();
    const navigate = useNavigate();

    console.log('debug', type);
    console.log('debug', role);

    return (
        <SettingsContext.Provider
            value={{
                adminMode: false,
            }}
        >
            <StyledContainer>
                <SettingsTiles
                    type={type}
                    id={id}
                    onDelete={() => {
                        console.log('navigate to catalog');
                        navigate('/catalog');
                    }}
                />
                <PendingMembersTable type={type} id={id} />
                <MembersTable type={type} id={id} />
                <UpdateSMSS id={id} />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
