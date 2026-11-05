import type { ReactNode } from "react";
import { act } from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ScopePicker } from "./scope-picker";
import { TerminalProvider, useTerminal } from "./terminal-context";

const { actions } = vi.hoisted(() => ({ actions: { run: vi.fn() } }));

vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ actions }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/shared", () => ({ AppCatalogAvatar: () => null }));
vi.mock("@semoss/panels", () => ({
	createAccessStore: () => ({}),
	AccessStoreProvider: ({ children }: { children: ReactNode }) => children,
}));

/** Exercise context updates from sibling panes with the real terminal provider. */
function ScopeControls() {
	const { fileMode, setSelectedApp, setTitle } = useTerminal();
	return (
		<>
			<output aria-label="File scope">
				{fileMode.type === "APP"
					? `APP:${fileMode.app}`
					: fileMode.type}
			</output>
			<button type="button" onClick={() => setTitle("Updated title")}>
				Update title
			</button>
			<button
				type="button"
				onClick={() =>
					setSelectedApp({
						project_id: "app-2",
						project_name: "Second App",
					})
				}
			>
				Select second project
			</button>
		</>
	);
}

describe("ScopePicker effects", () => {
	let container: HTMLDivElement;
	let root: Root;

	beforeEach(() => {
		vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
		actions.run.mockReset();
		actions.run.mockResolvedValue({
			pixelReturn: [
				{
					operationType: ["SUCCESS"],
					output: [
						{ project_id: "app-1", project_name: "First App" },
					],
				},
			],
		});
		container = document.createElement("div");
		document.body.append(container);
		root = createRoot(container);
	});

	afterEach(async () => {
		await act(async () => root.unmount());
		container.remove();
		vi.unstubAllGlobals();
	});

	async function mount(): Promise<void> {
		await act(async () => {
			root.render(
				<TerminalProvider>
					<ScopePicker />
					<ScopeControls />
				</TerminalProvider>,
			);
		});
	}

	async function clickButton(label: string): Promise<void> {
		const button = Array.from(container.querySelectorAll("button")).find(
			(element) => element.textContent?.trim() === label,
		);
		if (!button) throw new Error(`Missing button: ${label}`);
		await act(async () => button.click());
	}

	it("fetches once on opening and does not refetch for unrelated context updates", async () => {
		await mount();
		expect(actions.run).not.toHaveBeenCalled();
		await clickButton("scope.app");
		expect(actions.run).toHaveBeenCalledExactlyOnceWith(
			"META | MyProjects(limit=[50], offset=[0]);",
		);
		const searchInput = container.querySelector("input");
		expect(searchInput).not.toBeNull();
		expect(document.activeElement).toBe(searchInput);

		await clickButton("Update title");
		expect(actions.run).toHaveBeenCalledTimes(1);
		expect(container.querySelector("input")).toBe(searchInput);
	});

	it("synchronizes selected projects and scope changes without a context render loop", async () => {
		await mount();
		await clickButton("scope.app");
		await clickButton("First Appapp-1");
		expect(container.querySelector("output")?.textContent).toBe(
			"APP:app-1",
		);
		expect(actions.run).toHaveBeenLastCalledWith('LoadApp("app-1");');

		await clickButton("Select second project");
		expect(container.querySelector("output")?.textContent).toBe(
			"APP:app-2",
		);
		await clickButton("scope.user");
		expect(container.querySelector("output")?.textContent).toBe("USER");
		await clickButton("scope.insight");
		expect(container.querySelector("output")?.textContent).toBe("INSIGHT");
		expect(actions.run).toHaveBeenCalledTimes(2);
	});
});
