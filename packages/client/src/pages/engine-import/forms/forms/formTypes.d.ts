export type ImportFormComponent = React.FunctionComponent<{
    name: string;
    submitFunc?: (form) => void;
    setPredictDataTypes?: (val) => void;
    predictDataTypes?: unknown;
}> & {
    name2: string;

    logo: string;
};
