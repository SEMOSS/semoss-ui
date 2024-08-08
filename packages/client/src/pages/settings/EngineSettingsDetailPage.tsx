import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled, ToggleTabsGroup } from '@semoss/ui';

import { Role, ALL_TYPES } from '@/types';
import { useSettings, useAPI } from '@/hooks';
import {
    SettingsTiles,
    PendingMembersTable,
    MembersTable,
    UpdateSMSS,
} from '@/components/settings';

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

type VIEW = 'CURRENT' | 'PENDING';

/**
 * Show detailed settings for an engine
 */
interface EngineSettingsDetailPageProps {
    /** Type of the page to render */
    type: ALL_TYPES;
}

export const EngineSettingsDetailPage = (
    props: EngineSettingsDetailPageProps,
) => {
    const { type } = props;

    const { id } = useParams();
    const navigate = useNavigate();
    const { adminMode } = useSettings();

    const [view, setView] = useState<VIEW>('CURRENT');
    const [permission, setPermission] = useState<Role | null>(null);

    const getUserEnginePermission =
        !adminMode && useAPI(['getUserEnginePermission', id]);

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
                    type={type}
                    name={'engine'}
                    id={id}
                    onDelete={() => {
                        navigate('..', { relative: 'path' });
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
                </ToggleTabsGroup>
                {view === 'CURRENT' && (
                    <MembersTable
                        type={type}
                        id={id}
                        onChange={() => getUserEnginePermission.refresh()}
                    />
                )}
                {view === 'PENDING' && (
                    <PendingMembersTable type={type} id={id} />
                )}
            </StyledContent>
            {permission === 'OWNER' ? <UpdateSMSS type={type} id={id} /> : null}
        </StyledContainer>
    );
};
