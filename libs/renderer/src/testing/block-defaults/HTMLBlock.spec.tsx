import DOMPurify from "dompurify";
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

		const block = container.querySelector(
			"[data-block='html']",
		) as HTMLElement;
		expect(block).not.toBeNull();

		const shadowRoot = block.shadowRoot as ShadowRoot;
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

		const block = container.querySelector(
			"[data-block='html']",
		) as HTMLElement;
		expect(block).not.toBeNull();

		const shadowRoot = block.shadowRoot as ShadowRoot;
		expect(shadowRoot).not.toBeNull();
		expect(shadowRoot.innerHTML).toContain(`<img src="x">`);
		expect(shadowRoot.innerHTML).not.toContain(`onerror="alert('XSS')"`);
	});

	it("keeps comment-wrapped CSS while removing active content", () => {
		const { container } = render(<HTMLBlock id={blocks.html.id} />, {
			blocks: {
				html: {
					...blocks.html,
					data: {
						html: '<div><style><!--p.note { color: blue; }--></style><p class="note" onclick="alert(1)">Styled content</p><script>alert(1)</script></div>',
					},
				},
			},
		});

		const shadowRoot = container.querySelector<HTMLElement>(
			"[data-block='html']",
		)?.shadowRoot;
		expect(shadowRoot?.querySelector("style")?.textContent).toBe(
			"p.note { color: blue; }",
		);
		expect(shadowRoot?.querySelector("p.note")?.textContent).toBe(
			"Styled content",
		);
		expect(shadowRoot?.querySelector("script, [onclick]")).toBeNull();
	});

	it("keeps HTML links isolated from hooks on the shared sanitizer", () => {
		const alterLink = (node: Element): void => {
			if (node.tagName === "A") {
				node.setAttribute("target", "_blank");
				node.setAttribute("rel", "noopener");
			}
		};
		DOMPurify.addHook("afterSanitizeAttributes", alterLink);
		try {
			const { container } = render(<HTMLBlock id={blocks.html.id} />, {
				blocks: {
					html: {
						...blocks.html,
						data: {
							html: '<a href="https://example.com" target="_blank" rel="noopener noreferrer">Link</a>',
						},
					},
				},
			});
			const link = container
				.querySelector<HTMLElement>("[data-block='html']")
				?.shadowRoot?.querySelector("a");
			expect(link?.getAttribute("href")).toBe("https://example.com");
			expect(link?.getAttribute("target")).toBeNull();
			expect(link?.getAttribute("rel")).toBe("noopener noreferrer");
		} finally {
			DOMPurify.removeHook("afterSanitizeAttributes", alterLink);
		}
	});
});
