import { useNavigate } from 'react-router-dom';
import { Box, Stack, styled, Typography } from '@semoss/ui';
import {
    MembersTable,
    PendingMembersTable,
    SettingsTiles,
} from '@/components/settings';
import { SettingsContext } from '@/contexts';

// Styled components
const StyledBox = styled(Box)(({ theme }) => ({
    padding:theme.spacing(3),
    width: '100%' 
}));

const StyledSection = styled('section')(({ theme }) => ({
    paddingBottom: theme.spacing(3),
    width: '100%',
}));

const SectionHeading = styled(Typography)(({ theme }) => ({
    fontSize: 20,
    fontWeight: '500',
    marginBottom: theme.spacing(1),
}));

// Component props
interface AccessProps {
    appInfo: {
        project_name?: string;
    };
    appId: string;
    fetchUserSpecificData: () => void;
    permission: string;
}

export const AccessControl = ({
    appInfo,
    appId,
    fetchUserSpecificData,
    permission,
}: AccessProps) => {
    const navigate = useNavigate();

    return (
        <StyledBox>
            {permission === 'author' && (
                <StyledSection>
                    <SectionHeading variant="h2">Access</SectionHeading>
                    <SettingsContext.Provider value={{ adminMode: false }}>
                        <SettingsTiles
                            type="APP"
                            direction="row"
                            name={appInfo?.project_name || 'app'}
                            id={appId}
                            onDelete={() => {
                                navigate('/settings/app');
                            }}
                        />
                    </SettingsContext.Provider>
                </StyledSection>
            )}

            <StyledSection>
                <SectionHeading variant="h2">Current Member</SectionHeading>
                <SettingsContext.Provider value={{ adminMode: false }}>
                    <Stack direction="column" spacing={2}>
                        <PendingMembersTable type="APP" id={appId} />
                        <MembersTable
                            type="APP"
                            id={appId}
                            onChange={fetchUserSpecificData}
                        />
                    </Stack>
                </SettingsContext.Provider>
            </StyledSection>
        </StyledBox>
    );
};
