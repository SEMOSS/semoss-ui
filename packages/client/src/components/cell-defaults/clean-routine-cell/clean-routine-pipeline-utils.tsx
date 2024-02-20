import { operation } from './clean.types';

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
    compareValue: any,
    targetColumn: string,
    targetValue: any,
) => {
    return `${frameVariableName} | UpdateRowValues (${targetColumn}, ${
        typeof targetValue === 'string' ? `"${targetValue}"` : targetValue
    }), Filter (${compareColumn} ${compareOperator} ${
        typeof compareValue === 'string' ? `"${compareValue}"` : compareValue
    }))`;
};
