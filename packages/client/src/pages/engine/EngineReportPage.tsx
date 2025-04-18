import { styled } from '@semoss/ui';
import { SettingsContext } from '@/contexts';
import { useEngine, usePixel } from '@/hooks';
import { SETTINGS_PENDING_USER } from '@/components/settings';
import { UsagePerUserTable } from './UsagePerUserTable';
import { UsagePerProjectTable } from './UsagePerProjectTable';

const StyledContainer = styled('div')(({ theme }) => ({
    display: 'flex',
    // alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '5px',
    marginBottom: '50px',
}));

export const EngineReportPage = () => {
    return (
        <SettingsContext.Provider value={{ adminMode: false }}>
            <StyledContainer>
                <UsagePerUserTable />
            </StyledContainer>
            <StyledContainer>
                <UsagePerProjectTable />
            </StyledContainer>
        </SettingsContext.Provider>
    );
};
