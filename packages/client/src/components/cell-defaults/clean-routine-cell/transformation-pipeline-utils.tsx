import { operation } from './transformation.types';

export const getFrameHeaderTypesPipeline = (
    frameVariableName: string,
    headerTypes?: string[],
) => {
    return `META | ${frameVariableName} | FrameHeaders (${
        headerTypes ? `headerTypes = ${JSON.stringify(headerTypes)}` : ''
    });`;
};

export const getFrameUppercasePipeline = (
    frameVariableName: string,
    columnNames: string[],
) => {
    return `${frameVariableName} | ToUpperCase ( columns = ${JSON.stringify(
        columnNames,
    )} ) ;`;
};

export const getFrameUpdateRowValuesPipeline = (
    frameVariableName: string,
    compareColumn: string,
    compareOperator: operation,
    compareValue: string, // already wrapped in quotes if necessary
    targetColumn: string,
    targetValue: string, // already wrapped in quotes if necessary
) => {
    return `${frameVariableName} | UpdateRowValues (${targetColumn}, ${targetValue}, Filter (${compareColumn} ${compareOperator} ${compareValue}))`;
};
