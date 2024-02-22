export const getQueryPreviewPipeline = (frameVariableName: string) => {
    return `META|Frame( frame=[${frameVariableName}] )|QueryAll()|Limit(20)|CollectAll();`;
};

export const getQueryCountPipeline = (databaseId: string, query: string) => {
    return `Database(database=["${databaseId}"])|Query("<encode>${query}</encode>")|QueryRowCount();`;
};

export const getQueryRunPipelineCommand = (
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
