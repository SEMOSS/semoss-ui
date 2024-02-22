import { getQueryRunPipelineCommand } from '../shared';

export const getQueryImportPipeline = (
    databaseId: string,
    frameType: 'GRID' | 'PY' | 'R',
    frameVariableName: string,
    query: string,
    limit?: number,
) => {
    return `${getQueryRunPipelineCommand(
        databaseId,
        query,
        limit,
    )} | Import(frame=[${getImportFramePipelineCommand(
        frameType,
        frameVariableName,
    )}]);`;
};

const getImportFramePipelineCommand = (
    frameType: string,
    frameVariableName: string,
): string => {
    return `CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])`;
};
