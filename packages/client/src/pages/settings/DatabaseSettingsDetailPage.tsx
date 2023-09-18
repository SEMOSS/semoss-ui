import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { Permissions, SettingsTiles } from '@/components/settings';
import { useNavigate } from 'react-router-dom';
import { styled } from '@semoss/ui';
import { useSettings, useAPI } from '@/hooks';

const StyledContainer = styled('div')(({ theme }) => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: theme.spacing(2),
}));

export const DatabaseSettingsDetailPage = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();
    const { adminMode } = useSettings();

    const [permission, setPermission] = useState(3);

    const pixelString = 'getUserEnginePermission';
    const { data, status, refresh } = useAPI([pixelString, id]);

    /**
     * @name useEffect
     * @desc - Set Permission to see Pending Requests
     */
    useEffect(() => {
        if (status !== 'SUCCESS' || !data) {
            return;
        }

        if (
            data.permission === 'OWNER' ||
            data.permission === 'EDIT' ||
            adminMode
        ) {
            setPermission(1);
        }

        return () => {
            console.log('clean up permission');
            setPermission(3);
        };
    }, [status, data, adminMode]);

    return (
        <StyledContainer>
            {permission === 1 ? (
                <SettingsTiles
                    type={'database'}
                    id={id}
                    onDelete={() => {
                        console.log('navigate to database settings');
                        navigate('/settings/database');
                    }}
                />
            ) : null}
            <Permissions
                type={'database'}
                refreshPermission={refresh}
                config={{
                    id: id,
                    name: state ? state.name : 'Name not provided',
                    global: state ? state.global : false,
                    permission: permission,
                }}
            ></Permissions>
        </StyledContainer>
    );
};
