export interface PixelTaskOutput {
    data: {
        values: string[][];
        headers: string[];
        rawHeaders: string[];
    };
    headerInfo: Array<{
        additionalDataType: string;
        alias: string;
        derived: boolean;
        header: string;
        type: string;
    }>;
    numCollected: number;
    sources: Array<{
        name: string;
        type: string;
    }>;
    taskId: string;
}
interface PixelResponse {
    insightID: string;
    pixelReturn: Array<{
        isMeta: boolean;
        operationType: string[];
        output: PixelTaskOutput | string | Record<string, unknown>;
        pixelExpression: string;
        pixelId: string;
        additionalOutput: any[];
    }>;
}
