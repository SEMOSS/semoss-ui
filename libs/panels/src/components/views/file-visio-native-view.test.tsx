import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import { Activity } from "react";
import {
	createVsdx,
	editVsdx,
	parseVsdx,
	type ViewerHandle,
	type VisioEdit,
} from "visio-react-viewer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { encodeBytesToBase64 } from "@semoss/utility/encoding";
import type { FilePanelApi } from "../../hooks/use-file-panel";
import type { FileViewControls } from "../../types/file-view.types";
import { FileVisioView } from "./file-visio-view";

const harness = vi.hoisted(() => ({
	panel: null as FilePanelApi | null,
	toastError: vi.fn(),
}));
vi.mock("../../hooks/use-file-panel", () => ({
	useFilePanel: () => harness.panel,
}));
vi.mock("@semoss/shared", () => ({
	getFileEditorPathScope: () => "chat-insight",
	decodeBase64Asset: (value: string) =>
		Uint8Array.from(atob(value), (c) => c.charCodeAt(0)),
	getFileOperationErrorMessage: (message: string, error: Error) =>
		`${message}: ${error.message}`,
}));
vi.mock("@semoss/ui/next", async () => {
	const { createElement } = await import("react");
	const text = ({ children }: { children: React.ReactNode }) =>
		createElement("div", {}, children);
	return {
		toast: { error: harness.toastError },
		Alert: ({ children }: { children: React.ReactNode }) =>
			createElement("div", { role: "alert" }, children),
		AlertTitle: text,
		AlertDescription: text,
		Textarea: (props: React.ComponentProps<"textarea">) =>
			createElement("textarea", props),
		Button: ({
			children,
			onClick,
		}: {
			children: React.ReactNode;
			onClick: () => void;
		}) => createElement("button", { type: "button", onClick }, children),
	};
});
vi.mock("./office/office-viewer-frame", () => ({
	OfficeViewerFrame: ({ children }: { children: React.ReactNode }) =>
		children,
}));
vi.mock("./office/office-viewer-error", () => ({
	OfficeViewerError: ({ message }: { message: string }) => message,
}));

/** Runs real package edits behind the browser worker protocol missing in jsdom. */
const installEditWorker = () =>
	vi.stubGlobal(
		"Worker",
		class {
			onmessage: ((event: MessageEvent) => void) | null = null;
			onerror: ((event: ErrorEvent) => void) | null = null;
			terminate() {}
			postMessage(message: {
				bytes: ArrayBuffer;
				edits: readonly VisioEdit[];
			}) {
				void editVsdx(message.bytes, message.edits)
					.then(async (result) => {
						this.onmessage?.(
							new MessageEvent("message", {
								data: {
									ok: true,
									...result,
									document: await parseVsdx(result.bytes),
								},
							}),
						);
					})
					.catch((error: unknown) => {
						this.onmessage?.(
							new MessageEvent("message", {
								data: {
									ok: false,
									message:
										error instanceof Error
											? error.message
											: String(error),
									code:
										error &&
										typeof error === "object" &&
										"code" in error
											? error.code
											: undefined,
								},
							}),
						);
					});
			}
		},
	);

/** Open the selected fixture shape's actual native inline editor. */
const beginDraft = async (
	element: ViewerHandle["element"],
	text: string,
): Promise<HTMLTextAreaElement> => {
	const page = element.controller.state.document?.pages[0];
	if (!page) throw new Error("Missing page");
	await act(async () => {
		element.controller.selectShapes([
			{ id: "1001", name: "Test shape", pageId: page.id },
		]);
		element.shadowRoot?.querySelector(".viewport")?.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "F2",
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	const input =
		element.shadowRoot?.querySelector<HTMLTextAreaElement>("#edit-text");
	if (!input || input.hidden) throw new Error("Missing inline editor");
	input.value = text;
	return input;
};

const fixture = (name: string): Uint8Array =>
	new Uint8Array(
		readFileSync(
			resolve("src/components/views/__fixtures__", `visio-${name}.vsdx`),
		),
	);

beforeEach(async () => {
	vi.clearAllMocks();
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	vi.stubGlobal("matchMedia", () => ({
		matches: false,
		addEventListener() {},
		removeEventListener() {},
	}));
	vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
	vi.stubGlobal("CSS", { escape: (value: string) => value });
	vi.stubGlobal(
		"URL",
		class extends URL {
			static createObjectURL = vi.fn(() => "blob:visio-test");
			static revokeObjectURL = vi.fn();
		},
	);
	vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
		() => undefined,
	);
	harness.panel = {
		access: {
			status: "ready",
			readOnly: false,
			permission: "EDIT",
			refreshing: false,
			refresh: vi.fn(),
		},
		readOnly: false,
		targetInsightId: "chat-insight",
		read: {
			status: "SUCCESS",
			data: encodeBytesToBase64(await createVsdx()),
			revision: 1,
			refresh: vi.fn(),
		},
		save: vi.fn().mockResolvedValue(true),
		download: vi.fn(),
		isDownloading: false,
		isBusy: false,
		gate: null,
		readGate: null,
	};
});
afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllGlobals();
});

it("routes the installed Visio toolbar Save through panel persistence", async () => {
	let controls: FileViewControls | undefined;
	const view = render(
		<FileVisioView
			config={{
				mode: { type: "INSIGHT", insightId: "chat-insight" },
				path: "/drawing.vsdx",
				name: "drawing.vsdx",
			}}
			rename={vi.fn()}
			onControls={(next) => {
				controls = next;
			}}
		/>,
	);
	const element =
		view.container.querySelector<ViewerHandle["element"]>("visio-viewer");
	expect(element).not.toBeNull();
	if (!element) throw new Error("Missing native Visio viewer");
	await waitFor(() =>
		expect(element.controller.state.document).not.toBeNull(),
	);
	installEditWorker();
	const page = element.controller.state.document?.pages[0];
	if (!page) throw new Error("Missing drawing page");
	await act(async () => {
		await element.applyEdits([
			{
				type: "create-text-box",
				pageId: page.id,
				shapeId: "1001",
				x: 1,
				y: 1,
				width: 2,
				height: 1,
				text: "Saved collaboration edit",
			},
		]);
	});
	expect(controls?.isDirty).toBe(true);
	const titleBar = element.shadowRoot?.querySelector("office-ui-title-bar");
	expect(titleBar).not.toBeNull();
	await act(async () => {
		const button = titleBar?.shadowRoot?.querySelector<HTMLButtonElement>(
			'[data-command="save"]',
		);
		expect(button).toBeDefined();
		button?.click();
	});
	expect(harness.toastError).not.toHaveBeenCalled();
	expect(harness.panel?.save).toHaveBeenCalledOnce();
	expect(URL.createObjectURL).not.toHaveBeenCalled();
	expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
	const saved = vi.mocked(harness.panel?.save ?? vi.fn()).mock.calls[0]?.[0];
	if (!saved) throw new Error("No persisted drawing");
	expect(
		JSON.stringify(
			await parseVsdx(
				Uint8Array.from(atob(saved), (c) => c.charCodeAt(0)),
			),
		),
	).toContain("Saved collaboration edit");
	expect(controls?.isBusy).toBe(false);
	await act(async () => {
		element.controller.selectShapes([
			{ id: "1001", pageId: page.id, name: "Text" },
		]);
		element.shadowRoot?.querySelector(".viewport")?.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "F2",
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	const input =
		element.shadowRoot?.querySelector<HTMLTextAreaElement>("#edit-text");
	if (!input || input.hidden) throw new Error("Missing active text editor");
	input.value = "Text applied with Cmd+Enter";
	await act(async () => {
		input.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Enter",
				metaKey: true,
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	await waitFor(() =>
		expect(
			element.controller.state.document?.pages[0]?.shapes[0]?.text
				.plainText,
		).toBe("Text applied with Cmd+Enter"),
	);
	expect(harness.panel?.save).toHaveBeenCalledOnce();
	await act(async () => {
		element.shadowRoot?.querySelector(".viewport")?.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "F2",
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	input.value = "Latest inline text draft";
	const shortcut = new KeyboardEvent("keydown", {
		key: "s",
		metaKey: true,
		bubbles: true,
		composed: true,
		cancelable: true,
	});
	await act(async () => {
		input.dispatchEvent(shortcut);
	});
	expect(shortcut.defaultPrevented).toBe(true);
	await waitFor(() => expect(harness.panel?.save).toHaveBeenCalledTimes(2));
	const latest = vi
		.mocked(harness.panel?.save ?? vi.fn())
		.mock.calls.at(-1)?.[0];
	if (!latest) throw new Error("No persisted draft");
	expect(
		JSON.stringify(
			await parseVsdx(
				Uint8Array.from(atob(latest), (c) => c.charCodeAt(0)),
			),
		),
	).toContain("Latest inline text draft");
	if (!harness.panel) throw new Error("Missing panel");
	vi.stubGlobal("Worker", undefined);
	harness.panel.read = { ...harness.panel.read, data: latest, revision: 2 };
	view.rerender(
		<FileVisioView
			config={{
				mode: { type: "INSIGHT", insightId: "chat-insight" },
				path: "/drawing.vsdx",
				name: "drawing.vsdx",
			}}
			rename={vi.fn()}
			onControls={(next) => {
				controls = next;
			}}
		/>,
	);
	await waitFor(() =>
		expect(
			JSON.stringify(
				view.container.querySelector<ViewerHandle["element"]>(
					"visio-viewer",
				)?.controller.state.document,
			),
		).toContain("Latest inline text draft"),
	);
}, 90000);

it("edits native formatted text and fields while retaining refused formula/field drafts", async () => {
	let controls: FileViewControls | undefined;
	const view = render(
		<FileVisioView
			config={{
				mode: { type: "INSIGHT", insightId: "chat-insight" },
				path: "/drawing.vsdx",
				name: "drawing.vsdx",
			}}
			rename={vi.fn()}
			onControls={(next) => {
				controls = next;
			}}
		/>,
	);
	const element =
		view.container.querySelector<ViewerHandle["element"]>("visio-viewer");
	if (!element) throw new Error("Missing viewer");
	await waitFor(() =>
		expect(element.controller.state.document).not.toBeNull(),
	);
	installEditWorker();
	let savedCount = 0;
	for (const name of ["single-run", "stencil-local", "multi-run", "field"]) {
		await act(async () => {
			await element.load(fixture(name));
		});
		const original = element.controller.state.document?.pages[0]?.shapes[0];
		if (name === "multi-run") expect(original?.text.runs.length).toBe(2);
		if (name === "field") expect(original?.text.fields?.length).toBe(1);
		const input = await beginDraft(element, "Original changed");
		await act(async () => {
			input.dispatchEvent(
				new KeyboardEvent("keydown", {
					key: "Enter",
					metaKey: true,
					bubbles: true,
					composed: true,
					cancelable: true,
				}),
			);
		});
		await waitFor(
			() => expect(element.controller.state.edit.busy).toBe(false),
			{ timeout: 15000 },
		);
		expect(
			element.controller.state.document?.pages[0]?.shapes[0]?.text
				.plainText,
			`${name}: ${element.controller.state.edit.error?.message ?? "no transaction error"}`,
		).toBe("Original changed");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		await act(async () => controls?.save?.());
		savedCount++;
		await waitFor(() =>
			expect(harness.panel?.save).toHaveBeenCalledTimes(savedCount),
		);
		const saved = vi
			.mocked(harness.panel?.save ?? vi.fn())
			.mock.calls.at(-1)?.[0];
		if (!saved) throw new Error("Missing saved bytes");
		const reloaded = (
			await parseVsdx(
				Uint8Array.from(atob(saved), (c) => c.charCodeAt(0)),
			)
		).pages[0].shapes[0];
		expect(reloaded.text.plainText).toBe("Original changed");
		if (name === "multi-run")
			expect(reloaded.text.runs.some((run) => run.bold)).toBe(true);
		if (name === "field") expect(reloaded.text.fields?.length).toBe(1);
	}
	await act(async () => {
		await element.load(fixture("dynamic"));
	});
	const blocked = await beginDraft(
		element,
		"Keep this rejected formula draft",
	);
	await act(async () => {
		blocked.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "s",
				metaKey: true,
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	await waitFor(
		() => expect(element.controller.state.edit.busy).toBe(false),
		{ timeout: 15000 },
	);
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Dynamic ShapeSheet dependencies cannot be safely edited",
		),
	);
	expect(
		screen.getByRole("textbox", { name: "Unapplied shape text" }),
	).toHaveValue("Keep this rejected formula draft");
	expect(harness.panel?.save).toHaveBeenCalledTimes(savedCount);
	expect(harness.toastError).not.toHaveBeenCalled();
	expect(
		element.controller.state.document?.pages[0]?.shapes[0]?.text.plainText,
	).toBe("Original text");
	fireEvent.click(screen.getByRole("button", { name: "Dismiss draft" }));
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	await act(async () => {
		await element.load(fixture("field"));
	});
	const field = await beginDraft(element, "Modified text");
	await act(async () => {
		field.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Enter",
				metaKey: true,
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	await waitFor(() =>
		expect(screen.getByRole("alert")).toHaveTextContent(
			"Text fields are atomic",
		),
	);
	expect(
		screen.getByRole("textbox", { name: "Unapplied shape text" }),
	).toHaveValue("Modified text");
	expect(
		element.controller.state.document?.pages[0]?.shapes[0]?.text.plainText,
	).toBe("Original text");
	const corrected = await beginDraft(element, "Original changed");
	await act(async () => {
		corrected.dispatchEvent(
			new KeyboardEvent("keydown", {
				key: "Enter",
				metaKey: true,
				bubbles: true,
				composed: true,
				cancelable: true,
			}),
		);
	});
	await waitFor(
		() => expect(element.controller.state.edit.busy).toBe(false),
		{ timeout: 15000 },
	);
	await waitFor(() =>
		expect(
			element.controller.state.document?.pages[0]?.shapes[0]?.text
				.plainText,
		).toBe("Original changed"),
	);
	expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	expect(URL.createObjectURL).not.toHaveBeenCalled();
}, 180000);

it("keeps native Save and Cmd+S connected after collaboration hides and reveals the workbench", async () => {
	const content = (
		<FileVisioView
			config={{
				mode: { type: "INSIGHT", insightId: "chat-insight" },
				path: "/drawing.vsdx",
				name: "drawing.vsdx",
			}}
			rename={vi.fn()}
		/>
	);
	const view = render(<Activity mode="visible">{content}</Activity>);
	await waitFor(() =>
		expect(
			view.container.querySelector<ViewerHandle["element"]>(
				"visio-viewer",
			)?.controller.state.document,
		).not.toBeNull(),
	);
	view.rerender(<Activity mode="hidden">{content}</Activity>);
	view.rerender(<Activity mode="visible">{content}</Activity>);
	const element =
		view.container.querySelector<ViewerHandle["element"]>("visio-viewer");
	if (!element) throw new Error("Missing native Visio viewer");
	await waitFor(() =>
		expect(element.controller.state.document).not.toBeNull(),
	);
	await act(async () => {
		const titleBar = element.shadowRoot?.querySelector(
			"office-ui-title-bar",
		);
		titleBar?.dispatchEvent(
			new CustomEvent("office-command", {
				detail: { command: "save" },
				bubbles: true,
				composed: true,
			}),
		);
	});
	expect(harness.panel?.save).toHaveBeenCalledOnce();
	const shortcut = new KeyboardEvent("keydown", {
		key: "s",
		metaKey: true,
		bubbles: true,
		composed: true,
		cancelable: true,
	});
	await act(async () => {
		element.shadowRoot?.querySelector(".viewport")?.dispatchEvent(shortcut);
	});
	expect(shortcut.defaultPrevented).toBe(true);
	expect(harness.panel?.save).toHaveBeenCalledTimes(2);
	expect(URL.createObjectURL).not.toHaveBeenCalled();
	expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
}, 90000);
