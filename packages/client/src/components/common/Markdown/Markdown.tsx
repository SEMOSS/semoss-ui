import { useRef, useEffect } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

import css from '!!raw-loader!./markdown.css';

interface MarkdownProps {
    /** Content to render as HTML */
    content: string;
}

export const Markdown = (props: MarkdownProps) => {
    const { content } = props;
    const shadowRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!content) {
            return;
        }

        // parse the markdown and clean the html
        const html = DOMPurify.sanitize(marked.parse(content));

        let shadowRoot = shadowRef.current.shadowRoot;

        // attach a shadow root if it doesn't exist
        if (!shadowRoot) {
            shadowRoot = shadowRef.current.attachShadow({
                mode: 'open',
            });
        }

        /// add the html
        shadowRoot.innerHTML = `
            <style>
                ${css}
            </style>
            ${html}
        `;
    }, [content]);

    if (!content) {
        return null;
    }

    return <div ref={shadowRef}></div>;
};
