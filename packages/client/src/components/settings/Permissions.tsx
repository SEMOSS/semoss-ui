import { useState, SyntheticEvent } from 'react';
import { styled, ToggleTabsGroup } from '@semoss/ui';

import { useSettings } from '@/hooks';

import { AppSettings } from '../project';

import { SETTINGS_TYPE } from './settings.types';
import { PendingMembersTable } from './PendingMembersTable';
import { MembersTable } from './MembersTable';

interface PermissionConfig {
    id: string;
    name: string;
    global: boolean;
    visibility?: boolean;
    projectid?: string;
    // permission?: number;
}

export interface PermissionsProps {
    type: SETTINGS_TYPE;
    config: PermissionConfig;
}

const StyledContent = styled('div')(({ theme }) => ({
    display: 'flex',
    width: '100%',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
    flexShrink: '0',
}));

export const Permissions = (props: PermissionsProps) => {
    const { type, config } = props;
    const { id, name, projectid } = config;

    // Helper hooks
    const { adminMode } = useSettings();

    // New Design State Items
    const [view, setView] = useState(0);

    // Actually see if user is an owner or editor, quick fix
    const permission = adminMode ? 1 : 3;

    /**
     * @name handleChange
     * @param event
     * @param newValue
     * @desc changes tab group
     */
    const handleChange = (event: SyntheticEvent, newValue: number) => {
        setView(newValue);
    };

    return (
        <StyledContent>
            <ToggleTabsGroup
                value={view}
                onChange={handleChange}
                aria-label="basic tabs example"
            >
                <ToggleTabsGroup.Item label="Member" />
                <ToggleTabsGroup.Item
                    label="Pending Requests"
                    disabled={permission === 3}
                />
                {type === 'app' && <ToggleTabsGroup.Item label="Data Apps" />}
            </ToggleTabsGroup>
            {view === 0 && <MembersTable type={type} id={id} />}
            {view === 1 && <PendingMembersTable type={type} id={id} />}
            {view === 2 && <AppSettings id={id} />}
        </StyledContent>
    );
};
