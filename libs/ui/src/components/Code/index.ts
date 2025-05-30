import { Code, CodeProps } from "./Code";
import { CodeContainer, CodeContainerProps } from "./CodeContainer";

const CodeNameSpace = Object.assign(Code, {
    Container: CodeContainer,
});

export type { CodeProps, CodeContainerProps };

export { CodeNameSpace as Code };
