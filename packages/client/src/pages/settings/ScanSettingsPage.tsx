import { useEffect, useState } from 'react';

import { styled, useNotification, Typography, Paper, Grid } from '@semoss/ui';
import { useNavigate } from 'react-router-dom';
import { useRootStore, useAPI, useSettings } from '@/hooks';
import { LoadingScreen } from '@/components/ui';

const StyledPaper = styled(Paper)(({ theme }) => ({
    padding: '40px 30px 20px 50px',
}));

const GridItem = styled(Grid)(({ theme }) => ({
    padding: 0,
}));

const MonolithGrid = styled(Grid)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
}));

const capitalize = (input: string) => {
    return input.charAt(0).toUpperCase() + input.slice(1);
};

export const ScanSettingsPage = () => {
    const { adminMode } = useSettings();
    const { configStore, monolithStore } = useRootStore();
    const notification = useNotification();
    const navigate = useNavigate();

    if (!adminMode) {
        navigate('/settings');
    }

    const getScanningInfo = useAPI(['getScanningInfo', adminMode]);
    // TODO: get profiles and get member profiles
    //const getProfileInfo = useAPI(['getScanningInfo', adminMode]);
    // This should return a map of users and their profiles accesses
    //const getMemberProfiles = useAPI(['getMemberProfileList', adminMode]);

    // show a loading screen when getProjects is pending
    if (getScanningInfo.status !== 'SUCCESS') {
        return (
            <LoadingScreen.Trigger description="Retrieving security scanning information" />
        );
    }

    const {
        securityScanEnabled,
        securityScanEnforced,
        securityScanPromptURL,
        securityScanOutputURL,
        profileNames,
    } = getScanningInfo.data;

    const securityScanEnabledStr: String = String(securityScanEnabled);
    const securityScanEnforcedStr: String = String(securityScanEnforced);
    const profileNamesStr: String = profileNames.toString();

    // update this to populate profiles and current accesses
    // TODO: Make the info fields editable in the UI?
    return (
        <>
            <StyledPaper>
                <MonolithGrid container spacing={3}>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Security Scanning Enabled
                        </Typography>
                    </GridItem>
                    <GridItem sm={7}>{securityScanEnabledStr}</GridItem>
                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Security Scanning Enforced
                        </Typography>
                    </GridItem>

                    <GridItem sm={7}>{securityScanEnforcedStr}</GridItem>

                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Prompt Scanning URL
                        </Typography>
                    </GridItem>

                    <GridItem sm={7}>{securityScanPromptURL}</GridItem>

                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Output Scanning URL
                        </Typography>
                    </GridItem>

                    <GridItem sm={7}>{securityScanOutputURL}</GridItem>

                    <GridItem sm={4}>
                        <Typography variant="h6">
                            Available Info Access Profiles
                        </Typography>
                    </GridItem>

                    <GridItem sm={7}>{profileNamesStr}</GridItem>
                </MonolithGrid>
            </StyledPaper>
        </>
    );
};
