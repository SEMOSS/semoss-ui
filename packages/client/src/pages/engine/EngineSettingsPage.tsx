import { styled } from '@/component-library';
import { useNavigate } from 'react-router-dom';

import { SettingsContext } from '@/contexts';
import {
    MembersTable,
    PendingMembersTable,
    SettingsTiles,
    UpdateSMSS,
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

export const EngineSettingsPage = () => {
    const { id, name, type } = useEngine();
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
                    name={name}
                    id={id}
                    onDelete={() => {
                        navigate(`/engine/${type.toLowerCase()}`);
                    }}
                />
                <PendingMembersTable mode={'engine'} id={id} />
                <MembersTable mode={'engine'} id={id} name={name} />
                <UpdateSMSS mode={'engine'} id={id} />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
