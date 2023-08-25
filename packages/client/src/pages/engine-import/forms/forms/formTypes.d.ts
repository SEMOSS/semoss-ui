export type ImportFormComponent = React.FunctionComponent<{
    name: string;
    submitFunc?: (form) => void;
    predictDataTypes?: { pixelReturn: unknown };
    metamodel?: {
        dataTypes: Record<string, unknown>;
        startCount: number;
        fileName: string;
        headerModifications: Record<string, unknown>;
        positions: Record<string, { top: number; left: number }>;
        nodeProp: Record;
        fileLocation: string;
        additionalDataTypes: Record;
        relation: Record<
            Array,
            { relName: string; toTable: string; fromTable: string }
        >[];
    };
}> & {
    name2: string;

    logo: string;
};
