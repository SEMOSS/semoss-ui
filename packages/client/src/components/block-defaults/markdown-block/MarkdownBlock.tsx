import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlock, useTypeWriter } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface MarkdownBlockDef extends BlockDef<'markdown'> {
    widget: 'markdown';
    data: {
        style: CSSProperties;
        markdown: string;
        isStreaming: boolean;
    };
    slots: never;
}

export const MarkdownBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<MarkdownBlockDef>(id);
    let markdownTxt =
        typeof data.markdown == 'string'
            ? data.markdown
            : JSON.stringify(data.markdown);
    let displayTxt = useTypeWriter(data.isStreaming ? markdownTxt : '');
    if (!data.isStreaming) displayTxt = markdownTxt;

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
