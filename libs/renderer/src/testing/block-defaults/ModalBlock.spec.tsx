import { fireEvent, waitFor } from "@testing-library/react";
import { expect } from "vitest";
import { render } from "../utils";
import "@testing-library/jest-dom";

import { ModalBlock } from "@/components/block-defaults/modal-block/ModalBlock";

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
		const { container } = render(<ModalBlock id="modal-test" />, {
			blocks,
		});

		expect(container.querySelector("[data-block='modal-test']")).toBeNull();
		expect(document.querySelector("[role='presentation']")).toBeNull();
	});

	test("renders correctly when open", async () => {
		const { container } = render(<ModalBlock id="modal-test" />, {
			blocks: {
				"modal-test": {
					...blocks["modal-test"],
					data: {
						...blocks["modal-test"].data,
						open: true,
					},
				},
			},
		});

		expect(
			container.querySelector("[data-block='modal-test']"),
		).not.toBeNull();

		await waitFor(() => {
			expect(
				document.querySelector("[role='presentation']"),
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

		render(<ModalBlock id="modal-test" />, { blocks: stringBlocks });
		render(<ModalBlock id="modal-test" />, { blocks: numberBlocks });

		await waitFor(() => {
			expect(
				document.querySelectorAll("[role='presentation']"),
			).toHaveLength(2);
		});
	});

	test("displays title and renders slots", async () => {
		render(<ModalBlock id="modal-test" />, {
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
			const titleElement = document.querySelector(".MuiTypography-h6");
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

	test("clicking close button", async () => {
		render(<ModalBlock id="modal-test" />, {
			blocks: {
				"modal-test": {
					...blocks["modal-test"],
					data: {
						...blocks["modal-test"].data,
						open: true,
					},
				},
			},
		});

		await waitFor(() => {
			expect(
				document.querySelector("[role='presentation']"),
			).not.toBeNull();
			const closeButton = document.querySelector(".MuiIconButton-root");
			expect(closeButton).not.toBeNull();
		});

		const closeButton = document.querySelector(".MuiIconButton-root");
		fireEvent.click(closeButton);

		await waitFor(() => {
			expect(document.querySelector("[role='presentation']")).toBeNull();
		});
	});

	test("applies width styles correctly", async () => {
		render(<ModalBlock id="modal-test" />, {
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
				".MuiBox-root[style*='min-width']",
			) as HTMLElement;
			expect(modalContainer).not.toBeNull();
			expect(modalContainer.style.minWidth).toBe("444px");
			expect(modalContainer.style.maxWidth).toBe("1200px");
		});
	});

	test("renders in design mode", () => {
		const { container } = render(<ModalBlock id="modal-test" />, {
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
		});

		expect(
			container.querySelector("[data-block='modal-test']"),
		).not.toBeNull();
	});
});
