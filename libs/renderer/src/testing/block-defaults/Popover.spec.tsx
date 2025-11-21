import { expect } from "vitest";
import {
	PopoverBlock,
	type PopoverBlockDef,
} from "../../components/block-defaults/popover-block/PopoverBlock";
import { useBlock } from "../../hooks";
import type { ListenerActions } from "../../store";
import { render, renderHook } from "../utils";

const blocks = {
	helloText: {
		id: "helloText",
		widget: "text",
		parent: {
			id: "popover",
			slot: "content",
		},
		data: {
			style: {
				padding: "4px",
				whiteSpace: "pre-line",
				textOverflow: "ellipsis",
			},
			text: "Hello world",
			variant: "h1",
		},
		listeners: {},
		slots: {},
	},
	"target-container": {
		data: {
			style: {
				display: "flex",
				flexDirection: "column",
				padding: "4px",
				gap: "8px",
				flexWrap: "wrap",
			},
		},
		id: "target-container",
		widget: "container",
		slots: {
			children: {
				children: [],
				name: "",
			},
		},
		listeners: {
			onChange: [],
		},
	},
	popover: {
		parent: {
			id: "target-container",
			slot: "children",
		},
		data: {
			style: {},
			open: false,
			designMode: true,
			openTrigger: "click",
			contentBgColor: "",
			targetId: "target-container",
		},
		id: "popover",
		widget: "popover",
		slots: {
			content: {
				name: "content",
				children: [],
			},
		},
		listeners: {
			onOpen: {
				type: "async" as "async",
				order: [],
			},
			onClose: {
				type: "async" as "async",
				order: [] as ListenerActions[],
			},
		},
	},
	styledPopover: {
		parent: {
			id: "target-container",
			slot: "children",
		},
		data: {
			style: {
				height: "100px",
				width: "200px",
				backgroundColor: "#6c4747",
				border: "1px solid #000000",
			},
			open: false,
			designMode: true,
			openTrigger: "click",
			contentBgColor: "",
			targetId: "target-container",
		},
		id: "styledPopover",
		widget: "popover",
		slots: {
			content: {
				name: "content",
				children: ["helloText"],
			},
		},
		listeners: {
			onOpen: {
				type: "async" as "async",
				order: [],
			},
			onClose: {
				type: "async" as "async",
				order: [] as ListenerActions[],
			},
		},
	},
};

const mockPage = document.createElement("div");
mockPage.id = "page-1";
document.body.appendChild(mockPage);

describe("Popover Block", () => {
	it("renders correctly", async () => {
		const { container } = render(<PopoverBlock id={blocks.popover.id} />, {
			blocks,
		});

		expect(container.querySelector("[data-block='popover']"));
	});

	it("renders popover with correct styles and content", async () => {
		const { result } = renderHook(
			() => useBlock<PopoverBlockDef>("styledPopover"),
			{ blocks, renderEngineId: "styledPopover" },
		);

		expect(result.current).toBeDefined();

		const style = result.current.data.style;
		expect(style.height).toBe("100px");
	});
});
