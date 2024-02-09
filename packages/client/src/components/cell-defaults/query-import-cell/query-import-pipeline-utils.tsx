export const getQueryImportPipeline = (
    databaseId: string,
    frameType: 'GRID' | 'PY' | 'R',
    frameVariableName: string,
    query: string,
    limit?: number,
) => {
    return `${getQueryStructPipelineCommand(
        databaseId,
        query,
        limit,
    )} | Import(frame=[${getImportFramePipelineCommand(
        frameType,
        frameVariableName,
    )}]);`;
};

export const getQueryImportPreviewPipeline = (frameVariableName: string) => {
    return `META|Frame( frame=[${frameVariableName}] )|QueryAll()|Limit(20)|CollectAll();`;
};

export const getQueryImportCountPipeline = (
    databaseId: string,
    query: string,
) => {
    return `Database(database=["${databaseId}"])|Query("<encode>${query}</encode>")|QueryRowCount();`;
};

const getImportFramePipelineCommand = (
    frameType: string,
    frameVariableName: string,
): string => {
    return `CreateFrame(frameType=[${frameType}], override=[true]).as(["${frameVariableName}"])`;
};

const getQueryStructPipelineCommand = (
    databaseId: string,
    query: string,
    limit?: number,
) => {
    let pipelineCommand = `Database( database=["${databaseId}"] )|Query("<encode>${query}</encode>")`;
    if (limit > -1) {
        pipelineCommand += `|Limit${limit}`;
    }
    return pipelineCommand;
};
