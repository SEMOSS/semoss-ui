import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { getConnectorProvider } from "../connector.catalog";
import type { UseConnectionsResult } from "../use-connections";
import type { UseUserConnectorsResult } from "../use-user-connectors";
import { ConnectorsSettings } from "./connectors-settings";

const mocks = vi.hoisted(() => ({
	connections: null as unknown as UseConnectionsResult,
	userConnectors: null as unknown as UseUserConnectorsResult,
}));

vi.mock("@semoss/i18n", async (importOriginal) => ({
	...(await importOriginal<typeof import("@semoss/i18n")>()),
	useTranslation: () => ({ t: (key: string) => key }),
}));

// the session's logins and the user's connector file come from the server;
// the tests stand in for both
vi.mock("../use-connections", () => ({
	useConnections: () => mocks.connections,
}));
vi.mock("../use-user-connectors", () => ({
	useUserConnectors: () => mocks.userConnectors,
}));

/** Microsoft offered and signed out, Google not offered by this server. */
const createConnections = (
	connect: UseConnectionsResult["connect"],
): UseConnectionsResult => ({
	status: "ready",
	connections: [
		{
			provider: getConnectorProvider("MICROSOFT"),
			isAvailable: true,
			isConnected: false,
			accountName: "",
			isSessionLogin: false,
			canDisconnect: false,
		},
		{
			provider: getConnectorProvider("GOOGLE"),
			isAvailable: false,
			isConnected: false,
			accountName: "",
			isSessionLogin: false,
			canDisconnect: false,
		},
	],
	connectingProviderId: null,
	disconnectingProviderId: null,
	isServiceReady: () => false,
	isServiceCovered: () => true,
	hasAccessInfo: () => true,
	refresh: vi.fn(async () => undefined),
	connect: connect,
	disconnect: vi.fn(async () => undefined),
});

beforeEach(() => {
	mocks.userConnectors = {
		status: "ready",
		services: [],
		isSaving: false,
		setService: vi.fn(async () => undefined),
		enableServices: vi.fn(async () => undefined),
		disableServices: vi.fn(async () => undefined),
		reload: vi.fn(),
	};
});

describe("ConnectorsSettings", () => {
	test("switching on an app whose account is not connected signs in, then switches on that app alone", async () => {
		const connect = vi.fn(async () => true);
		mocks.connections = createConnections(connect);
		const user = userEvent.setup();
		render(<ConnectorsSettings />);

		const outlook = screen.getByRole("switch", {
			name: "services.outlook.name",
		});
		expect(outlook).toBeEnabled();
		await user.click(outlook);

		expect(connect).toHaveBeenCalledWith("MICROSOFT");
		await waitFor(() =>
			expect(mocks.userConnectors.setService).toHaveBeenCalledWith(
				"outlook",
				true,
			),
		);
		expect(mocks.userConnectors.enableServices).not.toHaveBeenCalled();
	});

	test("an app stays off when its sign in does not finish", async () => {
		mocks.connections = createConnections(vi.fn(async () => false));
		const user = userEvent.setup();
		render(<ConnectorsSettings />);

		const outlook = screen.getByRole("switch", {
			name: "services.outlook.name",
		});
		await user.click(outlook);

		await waitFor(() => expect(outlook).not.toBeChecked());
		expect(mocks.userConnectors.setService).not.toHaveBeenCalled();
	});

	test("a provider this server does not offer keeps its apps off and its sign in disabled", () => {
		mocks.connections = createConnections(vi.fn(async () => true));
		render(<ConnectorsSettings />);

		expect(
			screen.getByRole("switch", { name: "services.gmail.name" }),
		).toBeDisabled();
		const [microsoft, google] = screen.getAllByRole("button", {
			name: "providers.signIn",
		});
		expect(microsoft).toBeEnabled();
		expect(google).toBeDisabled();
		expect(screen.getByText("providers.unavailable")).toBeVisible();
	});
});
