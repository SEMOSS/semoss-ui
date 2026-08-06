import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBlock } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { resolveAppPagePath } from "../../../utility";

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
	const navigate = useNavigate();

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, [listeners.preProcess]);

	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		if (!data.href) {
			return;
		}

		const isFullUrl = /^(https?:)?\/\//.test(data.href);
		if (isFullUrl) {
			return; // External link, let default behavior happen
		} else if (data.href.startsWith("/")) {
			e.preventDefault();

			const path = resolveAppPagePath(data.href);
			if (path) {
				navigate(path);
			}
		}
	};

	return (
		<a
			href={data.href}
			style={{
				...data.style,
			}}
			onClick={handleClick}
			{...attrs}
		>
			{data.text}
		</a>
	);
});
