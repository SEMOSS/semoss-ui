import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useBlock } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface MarkdownBlockDef extends BlockDef<'markdown'> {
    widget: 'markdown';
    data: {
        style: CSSProperties;
        markdown: string;
    };
    slots: never;
}

export const MarkdownBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<MarkdownBlockDef>(id);

    return (
        <div
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {data.markdown}
            </ReactMarkdown>
        </div>
    );
});
