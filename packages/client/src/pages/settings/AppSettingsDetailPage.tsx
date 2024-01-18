import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled, ToggleTabsGroup, Typography } from '@semoss/ui';

import { Role } from '@/types';
import { useSettings, useAPI } from '@/hooks';
import {
    PendingMembersTable,
    MembersTable,
    SettingsTiles,
} from '@/components/settings';
import { AppSettings } from '@/components/app';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(3),
    flexShrink: '0',
}));

export const AppSettingsDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adminMode } = useSettings();

    const [permission, setPermission] = useState<Role | null>(null);

    const getUserEnginePermission = useAPI(['getUserProjectPermission', id]);

    /**
     * @name useEffect
     * @desc - Set Permission to see Pending Requests
     */
    useEffect(() => {
        // if it is an admin set as an owner
        if (adminMode) {
            setPermission('OWNER');
            return;
        }

        if (getUserEnginePermission.status !== 'SUCCESS') {
            return;
        }

        if (
            !getUserEnginePermission.data ||
            !getUserEnginePermission.data.permission
        ) {
            setPermission(null);
            return;
        }

        // set the permission
        setPermission(getUserEnginePermission.data.permission);
    }, [
        getUserEnginePermission.status,
        getUserEnginePermission.data,
        adminMode,
    ]);

    // if there is no permission, ignore
    if (!permission) {
        return null;
    }

    return (
        <StyledContainer>
            {permission === 'OWNER' ? (
                <StyledContent>
                    <Typography variant="h6">Access</Typography>
                    <SettingsTiles
                        mode={'app'}
                        name={'app'}
                        id={id}
                        onDelete={() => {
                            navigate('/settings/app');
                        }}
                    />
                </StyledContent>
            ) : (
                <></>
            )}

            {permission !== 'READ_ONLY' ? (
                <PendingMembersTable mode={'app'} id={id} />
            ) : (
                <></>
            )}

            <MembersTable
                id={id}
                mode={'app'}
                name={'app'}
                refreshPermission={() => getUserEnginePermission.refresh()}
            />

            {permission !== 'READ_ONLY' ? <AppSettings id={id} /> : <></>}
        </StyledContainer>
    );
};
