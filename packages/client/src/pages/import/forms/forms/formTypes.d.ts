export type ImportFormComponent = React.FunctionComponent<{
    name: string;
    submitFunc?: (form) => void;
}> & {
    name2: string;

    logo: string;
};
