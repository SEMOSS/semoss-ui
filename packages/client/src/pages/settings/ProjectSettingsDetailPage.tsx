import { useParams, useLocation } from 'react-router-dom';
import { Permissions, WorkflowAccess } from '@/components/database';
import { useNavigate } from 'react-router-dom';
import { styled } from '@semoss/ui';

const StyledContainer = styled('div')(() => ({
    width: '100%',
    display: 'flex',
    alignSelf: 'stretch',
    flexDirection: 'column',
    alignItems: 'flex-start',
}));

export const ProjectSettingsDetailPage = () => {
    const { id } = useParams();
    const { state } = useLocation();
    const navigate = useNavigate();

    // console.log('detail page', id, state);
    return (
        <StyledContainer>
            <WorkflowAccess
                type={'app'}
                id={id}
                projectId={undefined}
                onDelete={() => {
                    console.log('navigate to model settings');
                    navigate('/model');
                }}
            />
            <Permissions
                config={{
                    id: id,
                    name: state ? state.name : 'Name not provided',
                    global: state ? state.global : false,
                }}
            ></Permissions>
        </StyledContainer>
    );
};
