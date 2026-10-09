import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConnectorList, type ConnectorListProps } from "./connector-list";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

let root: Root;
let container: HTMLDivElement;
const retry = vi.fn();
const query = {
	status: "ready" as const,
	data: ["Saved row"],
	error: null,
	isRefreshing: false,
	reload: vi.fn(),
};

async function render(props: Partial<ConnectorListProps<string>> = {}) {
	await act(async () =>
		root.render(
			<ConnectorList
				query={query}
				serviceName="Mail"
				emptyText="No mail"
				isFull
				onShowMore={retry}
				{...props}
			>
				{(items) => items.map((item) => <li key={item}>{item}</li>)}
			</ConnectorList>,
		),
	);
}

async function click(label: string) {
	const button = Array.from(container.querySelectorAll("button")).find(
		(entry) => entry.textContent === label,
	);
	expect(button, label).toBeTruthy();
	await act(async () => button?.click());
}

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
	vi.clearAllMocks();
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});

afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("keeps existing rows with a failed-page alert and retry action", async () => {
	await render({
		loadMoreError: { kind: "other", message: "Network failed" },
	});
	expect(container.querySelector("li")?.textContent).toBe("Saved row");
	expect(container.querySelector('[role="alert"]')).toBeTruthy();
	await click("common.retry");
	expect(retry).toHaveBeenCalledOnce();
});

it("retains mail while a signed-out page offers sign in and retries on success", async () => {
	const signIn = vi.fn().mockResolvedValue(true);
	await render({
		loadMoreError: { kind: "signIn", message: "Sign in" },
		onSignIn: signIn,
	});
	expect(container.querySelector("li")?.textContent).toBe("Saved row");
	await click("status.signIn");
	expect(signIn).toHaveBeenCalledOnce();
	expect(retry).toHaveBeenCalledOnce();
});

it("disables and announces an in-progress next page without removing rows", async () => {
	await render({ query: { ...query, isRefreshing: true } });
	expect(container.querySelector("li")?.textContent).toBe("Saved row");
	expect(container.querySelector("button")?.disabled).toBe(true);
	expect(container.querySelector("output")?.textContent).toBe(
		"common.loadingMore",
	);
});

it("allows more pages after a page whose malformed rows were omitted", async () => {
	await render({ query: { ...query, data: [] } });
	expect(container.textContent).not.toContain("No mail");
	await click("common.showMore");
	expect(retry).toHaveBeenCalledOnce();
});
