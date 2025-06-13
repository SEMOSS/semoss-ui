import { CodeBlock, CodeBlockProps } from "./CodeBlock";
import {
    CodeBlockContainer,
    CodeBlockContainerProps,
} from "./CodeBlockContainer";

const CodeBlockNameSpace = Object.assign(CodeBlock, {
    Container: CodeBlockContainer,
});

export type { CodeBlockProps, CodeBlockContainerProps };

export { CodeBlockNameSpace as CodeBlock };
