import { styled } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';

import { SettingsContext } from '@/contexts';
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
                    type={type}
                    id={id}
                    name={name}
                    direction="row"
                    onDelete={() => {
                        navigate(`/engine/${type.toLowerCase()}`);
                    }}
                />
                <PendingMembersTable type={type} id={id} />
                <MembersTable type={type} id={id} />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
