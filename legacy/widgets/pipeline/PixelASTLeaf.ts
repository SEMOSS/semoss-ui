// want a better name for this
export default interface PixelASTLeaf {
    nounInputs: {
        frame?: any[];
        LAMBDA?: { type: string; value: PixelASTLeaf };
        frameType?: { type: string; value: string }[];
        qs?: any;
    };
    opName: string;
    opString: string;
    rowInputs: { type: string; value: any }[];
    scalarMap?: { type: string; value: string };
    widgetId?: string;
}
