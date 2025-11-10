import { expect } from "vitest";
import { HTMLBlock } from "../../components/block-defaults/html-block/HTMLBlock";
import { render } from "../utils";

const blocks = {
	html: {
		data: {
			html: "<p>Hello, World!</p>",
		},
		id: "html",
		widget: "html",
		slots: {},
		listeners: {},
	},
	emptyHtml: {
		data: {
			html: "",
		},
		id: "emptyHtml",
		widget: "html",
		slots: {},
		listeners: {},
	},
};

describe("HTML Block", () => {
	it("renders sanitized HTML content", async () => {
		const { container } = render(<HTMLBlock id={blocks.html.id} />, {
			blocks: blocks,
		});

		const block = container.querySelector("[data-block='html']");
		expect(block).not.toBeNull();

		const shadowRoot = block.shadowRoot;
		expect(shadowRoot).not.toBeNull();
		expect(shadowRoot.innerHTML).toContain("<p>Hello, World!</p>");
	});

	it("renders nothing when HTML content is empty", async () => {
		const { container } = render(<HTMLBlock id={blocks.emptyHtml.id} />, {
			blocks: blocks,
		});

		const block = container.querySelector("[data-block='html']");
		expect(block).toBeNull();
	});

	it("sanitizes potentially unsafe HTML", async () => {
		const unsafeBlocks = {
			html: {
				data: {
					html: `<img src="x" onerror="alert('XSS')" />`,
				},
				id: "html",
				widget: "html",
				slots: {},
				listeners: {},
			},
		};

		const { container } = render(<HTMLBlock id={blocks.html.id} />, {
			blocks: unsafeBlocks,
		});

		const block = container.querySelector("[data-block='html']");
		expect(block).not.toBeNull();

		const shadowRoot = block.shadowRoot;
		expect(shadowRoot).not.toBeNull();
		expect(shadowRoot.innerHTML).toContain(`<img src="x">`);
		expect(shadowRoot.innerHTML).not.toContain(`onerror="alert('XSS')"`);
	});
});
