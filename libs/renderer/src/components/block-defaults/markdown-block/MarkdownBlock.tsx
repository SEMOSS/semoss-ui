import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBlock, useTypeWriter } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";

export interface MarkdownBlockDef extends BlockDef<"markdown"> {
    widget: "markdown";
    data: {
        style: CSSProperties;
        markdown: string;
        isStreaming: boolean;
        show: string;
    };
    slots: never;
    listeners: {
        preProcess: true;
    };
}

export const MarkdownBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<MarkdownBlockDef>(id);
    const markdownTxt =
        typeof data.markdown == "string"
            ? data.markdown
            : JSON.stringify(data.markdown);
    let displayTxt = useTypeWriter(data.isStreaming ? markdownTxt : "");

    if (!data.isStreaming) displayTxt = markdownTxt;

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    return (
        <div
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {displayTxt}
            </ReactMarkdown>
        </div>
    );
});
