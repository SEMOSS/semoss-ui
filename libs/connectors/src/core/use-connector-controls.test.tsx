import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ConnectorViewerControls } from "./connector.types";
import { useConnectorControls } from "./use-connector-controls";

const Harness = ({
	href,
	onControlsChange,
}: {
	href: string;
	onControlsChange: (controls: ConnectorViewerControls) => void;
}) => {
	useConnectorControls(
		{ openIn: { href, label: "Open in Teams" } },
		onControlsChange,
	);
	return null;
};

let root: Root;
let container: HTMLDivElement;
const publish = async (href: string) => {
	const onControlsChange = vi.fn<(value: ConnectorViewerControls) => void>();
	await act(async () =>
		root.render(
			<Harness href={href} onControlsChange={onControlsChange} />,
		),
	);
	return onControlsChange.mock.lastCall?.[0];
};

beforeEach(() => {
	vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
	container = document.createElement("div");
	root = createRoot(container);
});
afterEach(async () => {
	await act(async () => root.unmount());
	vi.unstubAllGlobals();
});

it("publishes an absolute HTTPS open link", async () => {
	const controls = await publish(
		"https://teams.microsoft.com/l/chat/19:abc/0",
	);
	expect(controls?.openIn).toEqual({
		href: "https://teams.microsoft.com/l/chat/19:abc/0",
		label: "Open in Teams",
	});
});

it.each([
	"javascript:alert(1)",
	"http://teams.example/chat",
	"/l/chat/1",
	"//teams.example/chat",
])("publishes no open link for %s", async (href) => {
	const controls = await publish(href);
	expect(controls).toBeDefined();
	expect(controls?.openIn).toBeUndefined();
});
