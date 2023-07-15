import { Pipeline } from '@/components/pipeline';
import { PIPELINE_REGISTRY } from '@/components/pipeline-nodes';
import { styled } from '@semoss/ui';

const StyledContainer = styled('div')(() => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
}));

export const EditPipelinePage = (): JSX.Element => {
    return (
        <StyledContainer>
            <Pipeline registry={PIPELINE_REGISTRY} />
        </StyledContainer>
    );
};
