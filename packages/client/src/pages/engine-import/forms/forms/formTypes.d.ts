export type ImportFormComponent = React.FunctionComponent<{
    name: string;
    submitFunc?: (form) => void;
    predictDataTypes?: unknown;
    metamodel?: unknown;
}> & {
    name2: string;

    logo: string;
};
