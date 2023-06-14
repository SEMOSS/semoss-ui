interface GlobalStyleVariables {
    defaultMenu: string;
    defaultMenuDark: string;
    defaultPrimary: string;
    defaultPrimaryLight: string;
    defaultPrimaryDark: string;
    defaultBackground: string;
    defaultHighlight: string;
    backgroundAlt: string;
    spacingSize: string;
    borderColor: string;
    scrollSize: string;
    fontSize: string;
}

declare module '*.scss' {
    export const styleVariables: GlobalStyleVariables;
    export default styleVariables;
}
