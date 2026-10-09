import {
	fireEvent,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import { type ReactNode, useState } from "react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import { Logins } from "@semoss/sdk";
import { createWorkbenchStore } from "@semoss/workbench";
import {
	useWorkbenchConnectorNavigation,
	type WorkbenchConnectorBrowser,
} from "./workbench-connector-navigation.context";
import { WorkbenchConnectorNavigationProvider } from "./workbench-connector-navigation-provider";
import {
	type WorkbenchConnectorBrowserProps,
	WorkbenchConnectorPanel,
} from "./workbench-connector-panel";

vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));
const store = createWorkbenchStore({ components: {} });

const fixture = vi.hoisted(() => ({ host: {} as ConnectorViewerProps | null }));

vi.mock("./workbench-connector.context", () => ({
	useWorkbenchConnectorHost: () => fixture.host,
}));

vi.mock("@semoss/sdk", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/sdk")>()),
	Logins: { connect: vi.fn().mockResolvedValue(true) },
}));

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string) => {
			const labels: Record<string, string> = {
				"workbench.provider": "Provider",
				"accounts.microsoft": "Microsoft 365",
				"accounts.google": "Google Workspace",
				"common.loading": "Loading",
			};
			return labels[key] ?? key;
		},
	}),
}));

/** Stand-in browsing state verifies provider trees without network access. */
function TestViewer({
	provider,
	providerControl,
	onSignIn,
	onSaved,
	showHeader,
	isRowLoaded = true,
}: WorkbenchConnectorBrowserProps & { isRowLoaded?: boolean }) {
	const [selection, setSelection] = useState("");
	return (
		<div>
			{providerControl}
			{isRowLoaded ? (
				<button type="button" data-item-key="delayed">
					Selected email
				</button>
			) : null}
			<input
				aria-label={`${provider} selection`}
				value={selection}
				onChange={(event) => setSelection(event.target.value)}
			/>
			<button type="button" onClick={() => void onSignIn?.()}>
				Sign in {provider}
			</button>
			<button
				type="button"
				onClick={() =>
					onSaved?.({
						path: "mail.md",
						name: "mail.md",
						service:
							provider === "microsoft" ? "outlook-mail" : "gmail",
					})
				}
			>
				Save {provider}
			</button>
			<output aria-label="Viewer header">{String(showHeader)}</output>
		</div>
	);
}

/** Mount the actual account retention boundary around a lightweight viewer. */
function TestBrowser({
	browser = "emails",
	isRowLoaded,
}: {
	browser?: WorkbenchConnectorBrowser;
	isRowLoaded?: boolean;
}) {
	return (
		<WorkbenchConnectorPanel browser={browser}>
			{(props) => <TestViewer {...props} isRowLoaded={isRowLoaded} />}
		</WorkbenchConnectorPanel>
	);
}

/** Return as an external detail does, before its originating row is loaded. */
function ReturnAction() {
	const navigation = useWorkbenchConnectorNavigation();
	return (
		<button
			type="button"
			onClick={() =>
				navigation.returnToBrowser({
					browser: "emails",
					provider: "microsoft",
					itemKey: "delayed",
				})
			}
		>
			Return to selected email
		</button>
	);
}

/** Provide the same shared navigation state as the production chat host. */
function BrowserHost({ children }: { children: ReactNode }) {
	return (
		<WorkbenchConnectorNavigationProvider>
			{children}
		</WorkbenchConnectorNavigationProvider>
	);
}

async function chooseProvider(
	provider: "Google Workspace" | "Microsoft 365",
	root?: HTMLElement,
): Promise<void> {
	const scope = root ? within(root) : screen;
	fireEvent.keyDown(scope.getByRole("combobox", { name: "Provider" }), {
		key: "ArrowDown",
	});
	fireEvent.click(await screen.findByRole("option", { name: provider }));
	await waitFor(() =>
		expect(scope.getByRole("combobox", { name: "Provider" })).toHaveFocus(),
	);
}

beforeEach(() => {
	fixture.host = {};
	vi.clearAllMocks();
});

it("defaults to Microsoft and retains independent visited provider views without exposing hidden controls", async () => {
	render(<TestBrowser />, { wrapper: BrowserHost });
	expect(
		screen.getByRole("combobox", { name: "Provider" }),
	).toHaveTextContent("Microsoft 365");
	const microsoft = screen.getByRole("textbox", {
		name: "microsoft selection",
	});
	fireEvent.change(microsoft, {
		target: { value: "Microsoft folder and selection" },
	});
	expect(screen.queryByLabelText("google selection")).toBeNull();
	await chooseProvider("Google Workspace");
	const google = await screen.findByRole("textbox", {
		name: "google selection",
	});
	fireEvent.change(google, {
		target: { value: "Google folder and selection" },
	});
	expect(
		screen.queryByRole("textbox", { name: "microsoft selection" }),
	).toBeNull();
	await chooseProvider("Microsoft 365");
	expect(
		await screen.findByRole("textbox", { name: "microsoft selection" }),
	).toBe(microsoft);
	expect(microsoft).toHaveValue("Microsoft folder and selection");
	expect(
		screen.queryByRole("textbox", { name: "google selection" }),
	).toBeNull();
	await chooseProvider("Google Workspace");
	expect(
		await screen.findByRole("textbox", { name: "google selection" }),
	).toBe(google);
	expect(google).toHaveValue("Google folder and selection");
});

it("keeps mail and calendar provider choices separate", async () => {
	render(
		<>
			<section aria-label="Emails">
				<TestBrowser />
			</section>
			<section aria-label="Calendar">
				<TestBrowser browser="calendar" />
			</section>
		</>,
		{ wrapper: BrowserHost },
	);
	const emails = screen.getByRole("region", { name: "Emails" });
	const calendar = screen.getByRole("region", { name: "Calendar" });
	await chooseProvider("Google Workspace", emails);
	expect(
		within(emails).getByRole("combobox", { name: "Provider" }),
	).toHaveTextContent("Google Workspace");
	expect(
		within(calendar).getByRole("combobox", { name: "Provider" }),
	).toHaveTextContent("Microsoft 365");
});

it("passes save callbacks and opens the selected account's sign-in flow directly", async () => {
	const onSaved = vi.fn();
	fixture.host = { onSaved };
	render(<TestBrowser />, { wrapper: BrowserHost });
	expect(screen.getByLabelText("Viewer header")).toHaveTextContent("false");
	fireEvent.click(screen.getByRole("button", { name: "Sign in microsoft" }));
	expect(Logins.connect).toHaveBeenLastCalledWith("MICROSOFT", "microsoft");
	fireEvent.click(screen.getByRole("button", { name: "Save microsoft" }));
	expect(onSaved).toHaveBeenCalledWith({
		path: "mail.md",
		name: "mail.md",
		service: "outlook-mail",
	});
	await chooseProvider("Google Workspace");
	fireEvent.click(
		await screen.findByRole("button", { name: "Sign in google" }),
	);
	expect(Logins.connect).toHaveBeenLastCalledWith("GOOGLE", "google");
});

it("waits for the draft host before mounting a viewer", async () => {
	fixture.host = null;
	const { rerender } = render(<TestBrowser />, { wrapper: BrowserHost });
	expect(
		screen.getAllByRole("status", { name: "Loading" })[0],
	).toBeInTheDocument();
	expect(screen.queryByRole("combobox")).toBeNull();
	expect(screen.queryByRole("textbox")).toBeNull();
	fixture.host = {};
	rerender(<TestBrowser />);
	await waitFor(() =>
		expect(
			screen.getByRole("textbox", { name: "microsoft selection" }),
		).toBeVisible(),
	);
});

it("restores a row when the browser finishes loading it and cancels pending focus after another interaction", async () => {
	const { rerender } = render(
		<>
			<TestBrowser isRowLoaded={false} />
			<ReturnAction />
		</>,
		{ wrapper: BrowserHost },
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Return to selected email" }),
	);
	const provider = screen.getByRole("combobox", { name: "Provider" });
	await waitFor(() => expect(provider).toHaveFocus());
	rerender(
		<>
			<TestBrowser />
			<ReturnAction />
		</>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Selected email" }),
		).toHaveFocus(),
	);
	rerender(
		<>
			<TestBrowser isRowLoaded={false} />
			<ReturnAction />
		</>,
	);
	fireEvent.click(
		screen.getByRole("button", { name: "Return to selected email" }),
	);
	await waitFor(() => expect(provider).toHaveFocus());
	fireEvent.keyDown(provider, { key: "Tab" });
	const otherAction = screen.getByRole("button", {
		name: "Sign in microsoft",
	});
	otherAction.focus();
	rerender(
		<>
			<TestBrowser />
			<ReturnAction />
		</>,
	);
	await waitFor(() =>
		expect(
			screen.getByRole("button", { name: "Selected email" }),
		).toBeVisible(),
	);
	expect(otherAction).toHaveFocus();
});
