import { Code, type CodeProps } from "./Code";
import { CodeContainer, type CodeContainerProps } from "./CodeContainer";

const CodeNameSpace = Object.assign(Code, {
	Container: CodeContainer,
});

export type { CodeProps, CodeContainerProps };

export { CodeNameSpace as Code };
