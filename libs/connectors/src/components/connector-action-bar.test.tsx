import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConnectorActionBar } from "./connector-action-bar";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

let root: Root;
let container: HTMLDivElement;
const render = async (webUrl?: string) => {
	await act(async () =>
		root.render(
			<ConnectorActionBar
				onSave={() => undefined}
				saveLabel="Save"
				serviceName="Teams"
				webUrl={webUrl}
			/>,
		),
	);
};

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	container = document.createElement("div");
	document.body.append(container);
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	container.remove();
	vi.unstubAllGlobals();
});

it("opens an absolute HTTPS link in its own app", async () => {
	await render("https://teams.microsoft.com/l/chat/19:abc/0");
	expect(container.querySelector("a")?.getAttribute("href")).toBe(
		"https://teams.microsoft.com/l/chat/19:abc/0",
	);
});

it.each([
	undefined,
	"javascript:alert(1)",
	"http://teams.example/chat",
	"/l/chat/1",
	"//teams.example/chat",
])("offers no open link for %s", async (webUrl) => {
	await render(webUrl);
	expect(container.querySelector("a")).toBeNull();
	expect(container.textContent).toContain("Save");
});
