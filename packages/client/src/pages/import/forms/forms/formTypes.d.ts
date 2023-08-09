export type ImportFormComponent = React.FunctionComponent<{
    name: string;
    submitFunc?: (val) => void;
}> & {
    name2: string;

    logo: string;
};
