import { styled } from '@semoss/ui';
import { Navigate } from 'react-router-dom';
import { useSettings } from '@/hooks';
import { UserTable } from '@/components/settings';
import { SettingsContext } from '@/contexts';
import { MembersMetricsTable } from '@/components/settings/MembersMetricsTable';
const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));
export const MemberMetricsPage = () => {
    const { adminMode } = useSettings();

    if (!adminMode) {
        return <Navigate to="/settings" />;
    }

    return (
        <SettingsContext.Provider
            value={{
                adminMode: true,
            }}
        >
            <StyledContainer>
                <MembersMetricsTable />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
