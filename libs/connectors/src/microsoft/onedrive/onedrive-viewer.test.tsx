import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { OneDriveViewer } from "./onedrive-viewer";

const sdk = vi.hoisted(() => ({
	// one object each, so hooks keyed on them do not run again every render
	insight: { insightId: "origin", actions: { run: vi.fn() } },
	listing: { count: 0, files: [] as { id: string; name: string }[] },
	refresh: vi.fn(),
}));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => sdk.insight,
	usePixel: () => ({
		status: "SUCCESS",
		data: sdk.listing,
		refresh: sdk.refresh,
	}),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, options?: { count?: number }) =>
			options?.count === undefined ? key : `${key}(${options.count})`,
		i18n: { dir: () => "ltr", language: "en" },
	}),
}));

let root: Root;
let container: HTMLDivElement;

const list = (count: number) => {
	sdk.listing = {
		count: count,
		files: Array.from({ length: count }, (_, index) => ({
			id: `item-${index}`,
			name: `File ${index}.txt`,
		})),
	};
};
const render = async () => {
	await act(async () => root.render(<OneDriveViewer />));
};
const note = () =>
	document.querySelector('[data-testid="file-explorer-listing-note"]')
		?.textContent;
const showShared = async () => {
	const tab = Array.from(document.querySelectorAll('[role="tab"]')).find(
		(element) => element.textContent === "onedrive.shared",
	);
	if (!tab) throw new Error("No Shared with Me tab");
	// the tabs change on the press, not on the click that follows it
	await act(async () => {
		tab.dispatchEvent(
			new MouseEvent("mousedown", { bubbles: true, button: 0 }),
		);
	});
};

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	vi.stubGlobal(
		"ResizeObserver",
		class {
			observe() {}
			unobserve() {}
			disconnect() {}
		},
	);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("says nothing under a folder of the user's own that was read whole", async () => {
	list(3);
	await render();
	expect(note()).toBeUndefined();
});

it("says a listing stopped at the drive's limit, so a file past it is not taken for missing", async () => {
	list(200);
	await render();
	expect(note()).toBe("common.limitReached(200)");
});

it("says what is shared with the user comes from Microsoft's search, which lists a new share late", async () => {
	list(3);
	await render();
	await showShared();
	expect(note()).toBe("onedrive.sharedNote");

	list(200);
	await render();
	expect(note()).toBe("common.limitReached(200) onedrive.sharedNote");
});
