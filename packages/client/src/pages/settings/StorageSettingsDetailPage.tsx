import { useParams, useLocation } from 'react-router-dom';
import { Permissions, SettingsTiles } from '@/components/settings';
import { useNavigate } from 'react-router-dom';
import { styled } from '@semoss/ui';

const StyledContainer = styled('div')(() => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

export const StorageSettingsDetailPage = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    return (
        <StyledContainer>
            <SettingsTiles
                type={'storage'}
                id={id}
                onDelete={() => {
                    console.log('navigate to storage settings');
                    navigate('/storage');
                }}
            />
            <Permissions
                type="storage"
                config={{
                    id: id,
                    name: state ? state.name : 'Name not provided',
                    global: state ? state.global : false,
                }}
            ></Permissions>
        </StyledContainer>
    );
};
