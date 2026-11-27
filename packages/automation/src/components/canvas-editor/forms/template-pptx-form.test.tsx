// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TemplatePptxConfig } from "../../../domain/automation-workflow.types";
import { PptxPickContext, type PptxShapeSelection } from "../pptx-pick-context";
import { TemplatePptxForm } from "./template-pptx-form";

vi.mock("@semoss/sdk/react", () => ({
	usePixel: () => ({ status: "IDLE", data: undefined }),
	runPixel: vi.fn(),
}));

const config: TemplatePptxConfig = {
	templateFile: "decks/a.pptx",
	replacements: [],
};
let root: Root;
let container: HTMLDivElement;
const onChange = vi.fn();
const onPickShapes = vi.fn();

async function renderForm(shapeSelection: PptxShapeSelection | null = null) {
	await act(async () =>
		root.render(
			<PptxPickContext.Provider value={{ shapeSelection, onPickShapes }}>
				<TemplatePptxForm
					config={config}
					upstreamVars={[]}
					onChange={onChange}
					appId="app-1"
				/>
			</PptxPickContext.Provider>,
		),
	);
}

async function clickPickShapes() {
	const button = Array.from(document.querySelectorAll("button")).find(
		(element) => element.textContent?.includes("Pick"),
	);
	await act(async () => button?.click());
}

describe("TemplatePptxForm shape picking", () => {
	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
		vi.clearAllMocks();
	});

	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	it("asks the host to open the template only when pick mode turns on", async () => {
		await renderForm();

		await clickPickShapes();
		expect(onPickShapes).toHaveBeenCalledExactlyOnceWith("decks/a.pptx");

		await clickPickShapes();
		expect(onPickShapes).toHaveBeenCalledTimes(1);
	});

	it("adds a selected shape as a replacement while picking", async () => {
		await renderForm();
		await clickPickShapes();

		await renderForm({ shapeName: "Title 1", shapeType: "text", token: 1 });

		expect(onChange).toHaveBeenCalledWith({
			...config,
			replacements: [{ shapeName: "Title 1", type: "text", value: "" }],
		});
	});

	it("ignores a selected shape when pick mode is off", async () => {
		await renderForm({ shapeName: "Title 1", shapeType: "text", token: 1 });

		expect(onChange).not.toHaveBeenCalled();
	});
});
