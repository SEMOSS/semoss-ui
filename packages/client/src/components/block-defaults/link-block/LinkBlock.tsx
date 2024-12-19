import { CSSProperties } from 'react';
import { observer } from 'mobx-react-lite';
import { NavLink } from 'react-router-dom';

import { useBlock, useBlocks } from '@/hooks';
import { BlockDef, BlockComponent } from '@/stores';

export interface LinkBlockDef extends BlockDef<'link'> {
    widget: 'link';
    data: {
        style: CSSProperties;
        href: string;
        text: string;
        isExternal: boolean;
    };
}

export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data } = useBlock<LinkBlockDef>(id);
    const { state } = useBlocks();

    const handleNavigation = (ev) => {
        ev.preventDefault();
        if (state.mode === 'static') return;
        const extractedURL = extractBaseUrl(window.location.href);
        window.location.href = extractedURL + '/' + data.href;
    };

    const extractBaseUrl = (url) => {
        const parsedUrl = new URL(url);
        const pathSegments = parsedUrl.hash.slice(1).split('/');

        // Find the index of the first segment that looks like an ID
        const idIndex = pathSegments.findIndex((segment) =>
            segment.match(
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
            ),
        );

        if (idIndex !== -1) {
            const extractedPath = pathSegments.slice(0, idIndex + 1).join('/');
            return `${parsedUrl.origin}${parsedUrl.pathname}#${extractedPath}`;
        }

        // If no ID is found, return the original URL
        return url;
    };

    return data.isExternal ? (
        <a
            id="link"
            href={data.href}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </a>
    ) : (
        <NavLink
            to="#"
            onClick={handleNavigation}
            style={{
                ...data.style,
            }}
            {...attrs}
        >
            {data.text}
        </NavLink>
    );
});
