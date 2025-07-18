import { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock } from "../../../hooks";
import { BlockDef, BlockComponent, ListenerActions } from "../../../store";

export interface LinkBlockDef extends BlockDef<"link"> {
    widget: "link";
    data: {
        style: CSSProperties;
        href: string;
        text: string;
        show: string;
    };
    listeners: {
        preProcess: {
            type: "sync" | "async";
            order: ListenerActions[];
        };
    };
}

/*
TODO: If this is a link to somewhere internally on app switch to a Link (react-router)
*/
export const LinkBlock: BlockComponent = observer(({ id }) => {
    const { attrs, data, listeners } = useBlock<LinkBlockDef>(id);
    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    const navigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
        if (!data.href) {
            return;
        }

        const isFullUrl = /^(https?:)?\/\//.test(data.href);
        if (isFullUrl) {
            return; // External link, let default behavior happen
        } else if (data.href.startsWith("/")) {
            e.preventDefault();

            const hash = window.location.hash;
            // Match either #/s/:id/ or #/:id/view
            const appPageMatch = hash.match(/^#\/app\/([^/]+)/);
            const sharePageMatch = hash.match(/^#\/s\/([^/]+)/);

            if (appPageMatch || sharePageMatch) {
                const base = appPageMatch ? appPageMatch[0] : sharePageMatch[0]; // This will be either #/s/:id/ or #/:id/view
                const newHash = data.href.startsWith("/")
                    ? base.replace(/\/$/, "") + data.href
                    : base + data.href; // Avoid double slashes

                window.location.hash = newHash;
            }
        }
    };

    return (
        <a
            href={data.href}
            style={{
                ...data.style,
            }}
            onClick={navigate}
            {...attrs}
        >
            {data.text}
        </a>
    );
});
