import { waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { ModalBlock } from "../../components/block-defaults/modal-block/ModalBlock";
import { render } from "../utils";

const blocks = {
	"modal-test": {
		data: {
			style: {},
			title: "Test Modal",
			fullWidth: false,
			maxWidth: "md" as const,
			minWidth: "sm" as const,
			designMode: false,
			open: false,
		},
		id: "modal-test",
		widget: "modal" as const,
		slots: {
			content: { name: "content", children: [] },
			footer: { name: "footer", children: [] },
		},
		listeners: {
			preProcess: { type: "sync" as const, order: [] },
			onClose: { type: "sync" as const, order: [] },
		},
	},
};

const mockPage = document.createElement("div");
mockPage.id = "page-1";
document.body.appendChild(mockPage);

describe("ModalBlock", () => {
	test("renders correctly when closed", () => {
		const { container } = render(
			<ModalBlock id={blocks["modal-test"].id} />,
			{
				blocks,
			},
		);

		expect(container.querySelector("[data-block='modal-test']")).toBeNull();
		expect(document.querySelector("[role='presentation']")).toBeNull();
	});

	test("renders correctly when open", async () => {
		const { container } = render(
			<ModalBlock id={blocks["modal-test"].id} />,
			{
				blocks: {
					"modal-test": {
						...blocks["modal-test"],
						data: {
							...blocks["modal-test"].data,
							open: true,
						},
					},
				},
			},
		);

		expect(
			container.querySelector("[data-block='modal-test']"),
		).not.toBeNull();

		await waitFor(() => {
			expect(
				document.querySelector(
					"div.absolute.inset-0[class*='bg-black']",
				),
			).not.toBeNull();
		});
	});

	test("handles different open types", async () => {
		const stringBlocks = {
			"modal-test": {
				...blocks["modal-test"],
				data: {
					...blocks["modal-test"].data,
					open: "true",
				},
			},
		};

		const numberBlocks = {
			"modal-test": {
				...blocks["modal-test"],
				data: {
					...blocks["modal-test"].data,
					open: 1,
				},
			},
		};

		render(<ModalBlock id={blocks["modal-test"].id} />, {
			blocks: stringBlocks,
		});
		render(<ModalBlock id={blocks["modal-test"].id} />, {
			blocks: numberBlocks,
		});

		await waitFor(() => {
			expect(
				document.querySelectorAll(
					"div.absolute.inset-0[class*='bg-black']",
				),
			).toHaveLength(2);
		});
	});

	test("displays title and renders slots", async () => {
		render(<ModalBlock id={blocks["modal-test"].id} />, {
			blocks: {
				"content-text": {
					id: "content-text",
					widget: "text",
					parent: { id: "modal-test", slot: "content" },
					data: { text: "Modal content" },
					listeners: {},
					slots: {},
				},
				"footer-text": {
					id: "footer-text",
					widget: "text",
					parent: { id: "modal-test", slot: "footer" },
					data: { text: "Modal footer" },
					listeners: {},
					slots: {},
				},
				"modal-test": {
					...blocks["modal-test"],
					data: {
						...blocks["modal-test"].data,
						title: "Open Modal",
						open: true,
					},
					slots: {
						content: {
							name: "content",
							children: ["content-text"],
						},
						footer: { name: "footer", children: ["footer-text"] },
					},
				},
			},
		});

		await waitFor(() => {
			const titleElement = document.querySelector(
				"h2.font-semibold",
			) as HTMLElement;
			expect(titleElement).not.toBeNull();
			expect(titleElement.textContent).toBe("Open Modal");

			expect(
				document.querySelector("[data-block='content-text']"),
			).not.toBeNull();
			expect(
				document.querySelector("[data-block='footer-text']"),
			).not.toBeNull();
			expect(
				document.querySelector("[data-block='content-text']"),
			).toHaveTextContent("Modal content");
			expect(
				document.querySelector("[data-block='footer-text']"),
			).toHaveTextContent("Modal footer");
		});
	});

	test("applies width styles correctly", async () => {
		render(<ModalBlock id={blocks["modal-test"].id} />, {
			blocks: {
				"modal-test": {
					...blocks["modal-test"],
					data: {
						...blocks["modal-test"].data,
						fullWidth: true,
						maxWidth: "lg" as const,
						minWidth: "xs" as const,
						open: true,
					},
				},
			},
		});

		await waitFor(() => {
			const modalContainer = document.querySelector(
				"div[style*='min-width']",
			) as HTMLElement;
			expect(modalContainer).not.toBeNull();
			expect(modalContainer.style.minWidth).toBe("444px");
			expect(modalContainer.style.maxWidth).toBe("1200px");
		});
	});

	test("renders in design mode", () => {
		const { container } = render(
			<ModalBlock id={blocks["modal-test"].id} />,
			{
				blocks: {
					"modal-test": {
						...blocks["modal-test"],
						data: {
							...blocks["modal-test"].data,
							designMode: true,
							open: true,
						},
					},
				},
			},
		);

		expect(
			container.querySelector("[data-block='modal-test']"),
		).not.toBeNull();
	});
});
