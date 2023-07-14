import { Pipeline } from '@/components/pipeline';
import { PIPELINE_REGISTRY } from '@/components/pipeline-nodes';

export const EditPipelinePage = (): JSX.Element => {
    return <Pipeline registry={PIPELINE_REGISTRY} />;
};
