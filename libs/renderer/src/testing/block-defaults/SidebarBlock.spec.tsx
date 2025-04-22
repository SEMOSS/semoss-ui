import { SidebarBlock } from "@/components/block-defaults/sidebar-block/SidebarBlock";
import { render, screen } from "../utils";

const blocks = {
	"hello-text": {
		id: "hello-text",
		widget: "text",
		parent: {
			id: "test-sidebar",
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

	"test-sidebar": {
		id: "test-sidebar",
		widget: "sidebar",
		data: {
			style: {
				width: "240px",
				height: "100%",
			},
			open: "false",
			anchor: "left",
			variant: "undefined",
			// designMode: true,
		},
		listeners: {},
		slots: {
			content: {
				name: "content",
				children: ["hello-text"],
			},
		},
	},
};
describe("Testing the Sidebar Block", async () => {
	it("Should render the sidebar", async () => {
		const { container } = render(<SidebarBlock id="test-sidebar" />, {
			blocks: blocks,
		});
		const exist = container.querySelector("[data-block='test-sidebar']");
		// console.log(container.innerHTML)
		expect(exist).toBeInTheDocument();
	});
	it("Should render the sidebar in its closed state and content to not be visible", async () => {
		const { container } = render(<SidebarBlock id="test-sidebar" />, {
			blocks: blocks,
		});
		expect(screen.queryByText("Hello world")).not.toBeVisible();
	});
	it("Should render the sidebar in its open state and content to be visible", async () => {
		const { container } = render(<SidebarBlock id="test-sidebar" />, {
			blocks: {
				"hello-text": {
					...blocks["hello-text"],
				},
				"test-sidebar": {
					...blocks["test-sidebar"],
					data: {
						...blocks["test-sidebar"].data,
						open: "true",
					},
				},
			},
		});

		expect(screen.getByText("Hello world")).toBeVisible();
	});
});