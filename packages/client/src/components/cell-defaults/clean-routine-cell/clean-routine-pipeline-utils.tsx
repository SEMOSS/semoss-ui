export const getFrameHeaderTypesPipeline = (
    frameVariableName: string,
    headerTypes: string[],
) => {
    return `META | ${frameVariableName} | FrameHeaders (headerTypes = ${JSON.stringify(
        headerTypes,
    )});`;
};

export const getFrameUppercasePipeline = (
    frameVariableName: string,
    columns: string[],
) => {
    return `${frameVariableName} | ToUpperCase ( columns = ${JSON.stringify(
        columns,
    )} ) ;`;
};
