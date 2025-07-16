import { CSSProperties, ReactElement, useEffect } from "react";
import { observer } from "mobx-react-lite";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useBlock, useTypeWriter } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";
import { LoadingScreen } from "@semoss/ui";
import { LoadingSkeleton } from "../../../assets/skeleton/LoadingSkeleton";

export interface MarkdownBlockDef extends BlockDef<"markdown"> {
    widget: "markdown";
    data: {
        style: CSSProperties;
        markdown: string;
        isStreaming: boolean;
        show: string;
        loading: boolean | string;
        loadSkeleton: string;
    };
    slots: never;
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
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

    const isLoading =
        data.hasOwnProperty("loading") &&
        data.loading?.toString().toLowerCase() === "true";

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const loadTemplate = (template: string): ReactElement => {
        if (template === "LoadingSkeleton") {
            return <LoadingSkeleton />;
        }
    };

    return (
        <div
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            <LoadingScreen relative>
                {isLoading ? (
                    data.loadSkeleton ? (
                        loadTemplate(data.loadSkeleton)
                    ) : (
                        <LoadingScreen.Trigger />
                    )
                ) : null}
                {isLoading && data.loadSkeleton ? null : (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {displayTxt}
                    </ReactMarkdown>
                )}
            </LoadingScreen>
        </div>
    );
});
