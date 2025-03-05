import { styled } from '@semoss/ui';
import { SettingsContext } from '@/contexts';
import { useEngine, usePixel } from '@/hooks';
import { SETTINGS_PENDING_USER } from '@/components/settings';
import { UsagePerUserTable } from './UsagePerUserTable';
import { UsagePerProjectTable } from './UsagePerProjectTable';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    marginBottom: '50px',
}));

export const EngineReportPage = () => {
    const { id, type } = useEngine();
    const usagePerUserPixel = [
        'DATABASE',
        'STORAGE',
        'MODEL',
        'VECTOR',
        'FUNCTION',
    ].includes(type)
        ? `GetEngineUsagePerUser(engine='${id}');`
        : '';
    const usagePerProjectPixel = [
        'DATABASE',
        'STORAGE',
        'MODEL',
        'VECTOR',
        'FUNCTION',
    ].includes(type)
        ? `GetEngineUsagePerProject(engine='${id}');`
        : '';

    const usagePerUser = usePixel<SETTINGS_PENDING_USER[]>(usagePerUserPixel);
    const usagePerProject =
        usePixel<SETTINGS_PENDING_USER[]>(usagePerProjectPixel);

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
