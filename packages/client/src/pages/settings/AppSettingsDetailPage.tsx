import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled, ToggleTabsGroup } from '@semoss/ui';

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
    gap: theme.spacing(2),
}));

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexShrink: '0',
}));

type VIEW = 'CURRENT' | 'PENDING' | 'APP';

export const AppSettingsDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { adminMode } = useSettings();

    const [view, setView] = useState<VIEW>('CURRENT');
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
                <SettingsTiles
                    type={'APP'}
                    name={'app'}
                    id={id}
                    direction={'row'}
                    onDelete={() => {
                        navigate('/settings/app');
                    }}
                />
            ) : null}
            <StyledContent>
                <ToggleTabsGroup
                    value={view}
                    onChange={(e, v) => setView(v as VIEW)}
                >
                    <ToggleTabsGroup.Item label="Member" value={'CURRENT'} />
                    <ToggleTabsGroup.Item
                        label="Pending Requests"
                        disabled={permission === 'READ_ONLY'}
                        value={'PENDING'}
                    />
                    <ToggleTabsGroup.Item
                        label="Data Apps"
                        disabled={permission === 'READ_ONLY'}
                        value={'APP'}
                    />
                </ToggleTabsGroup>
                {view === 'CURRENT' && (
                    <MembersTable
                        id={id}
                        type={'APP'}
                        onChange={() => getUserEnginePermission.refresh()}
                    />
                )}
                {view === 'PENDING' && (
                    <PendingMembersTable id={id} type={'APP'} />
                )}
                {view === 'APP' && <AppSettings id={id} />}
            </StyledContent>
        </StyledContainer>
    );
};
