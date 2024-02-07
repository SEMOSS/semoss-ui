import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { styled, ToggleTabsGroup } from '@/component-library';

import { ENGINE_TYPES, Role } from '@/types';
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
    type: ENGINE_TYPES;
}

export const EngineSettingsDetailPage = (
    props: EngineSettingsDetailPageProps,
) => {
    const { type } = props;

    // get a pretty name
    const name = type
        .replace(/^[-_]*(.)/, (_, c) => c.toUpperCase())
        .replace(/[-_]+(.)/g, (_, c) => ' ' + c.toUpperCase());

    const { id } = useParams();
    const navigate = useNavigate();
    const { adminMode } = useSettings();

    const [view, setView] = useState<VIEW>('CURRENT');
    const [permission, setPermission] = useState<Role | null>(null);

    const getUserEnginePermission = useAPI(['getUserEnginePermission', id]);

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
                    mode="engine"
                    name={name}
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
                        mode={'engine'}
                        id={id}
                        name={name}
                        refreshPermission={() =>
                            getUserEnginePermission.refresh()
                        }
                    />
                )}
                {view === 'PENDING' && (
                    <PendingMembersTable id={id} mode={'engine'} />
                )}
            </StyledContent>
            {permission === 'OWNER' ? (
                <UpdateSMSS mode="engine" id={id} />
            ) : null}
        </StyledContainer>
    );
};
