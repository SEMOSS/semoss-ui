import { render, screen } from "@testing-library/react";
import type {
	ConnectorSavedFile,
	ConnectorViewerProps,
} from "@semoss/connectors";
import { FILE_PANEL_EVENTS, getFilePanelScope } from "@semoss/panels";
import { useInsight } from "@semoss/sdk/react";
import { createWorkbenchStore } from "@semoss/workbench";
import { RoomSession } from "@/features/rooms/room-session";
import { useWorkbenchConnectorHost } from "./workbench-connector.context";
import { WorkbenchConnectorProvider } from "./workbench-connector-provider";

vi.mock("@semoss/sdk", async (original) => ({
	...(await original<typeof import("@semoss/sdk")>()),
	Insight: class {
		insightId = crypto.randomUUID();
		isReady = true;
		isInitialized = true;
		isAuthorized = true;
		error = null;
		system = {};
		actions = {};
		destroy = vi.fn();
	},
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	toast: { success: vi.fn() },
}));
vi.mock("@/features/tools/tool-workbench.context", () => ({
	useToolWorkbench: () => ({ store }),
}));

let store = createWorkbenchStore({ components: {} });
let currentHost: ConnectorViewerProps | null = null;

/** Capture the viewer contract and the insight visible to its descendants. */
function ViewerProbe() {
	currentHost = useWorkbenchConnectorHost();
	const { insightId } = useInsight();
	return <output aria-label="Viewer insight">{insightId}</output>;
}

/** Return the contract once the test session is ready. */
function host(): ConnectorViewerProps {
	if (!currentHost) throw new Error("Viewer host is not ready");
	return currentHost;
}

/** Render without initializing or mutating a real backend session. */
function view(session: RoomSession, isReady = true) {
	return (
		<WorkbenchConnectorProvider
			session={session}
			snapshot={{ ...session.getSnapshot(), isReady }}
		>
			<ViewerProbe />
		</WorkbenchConnectorProvider>
	);
}

const file: ConnectorSavedFile = {
	name: "Meeting.md",
	path: "Meeting.md",
	service: "google-calendar",
};

beforeEach(() => {
	vi.clearAllMocks();
	store = createWorkbenchStore({ components: {} });
	currentHost = null;
});

it("uses the draft insight for browsing without creating a room", () => {
	const session = new RoomSession("account");
	const create = vi.spyOn(session, "create");
	const { rerender } = render(view(session, false));
	expect(currentHost).toBeNull();
	expect(screen.getByLabelText("Viewer insight")).toHaveTextContent(
		session.insight.insightId,
	);
	rerender(view(session));
	expect(host().saveTargetName).toBe("card.chatFiles");
	expect(create).not.toHaveBeenCalled();
});

it("retains the session until the saver releases it and releases failed preparation", async () => {
	const session = new RoomSession("account");
	const release = vi.fn();
	vi.spyOn(session, "retain").mockReturnValue(release);
	const create = vi.spyOn(session, "create").mockResolvedValue("room-one");
	render(view(session));
	const finish = await host().prepareSave?.();
	expect(create).toHaveBeenCalledWith("New chat");
	expect(release).not.toHaveBeenCalled();
	if (typeof finish !== "function") throw new Error("Missing save release");
	finish();
	expect(release).toHaveBeenCalledOnce();
	create.mockRejectedValueOnce(new Error("Room preparation failed"));
	await expect(host().prepareSave?.()).rejects.toThrow(
		"Room preparation failed",
	);
	expect(release).toHaveBeenCalledTimes(2);
});

it("refreshes saved files without adding a context item for save-only actions", () => {
	const session = new RoomSession("account");
	const emit = vi.spyOn(store.getState().events.actions, "emit");
	render(view(session));
	host().onSaved?.(file);
	expect(session.getSnapshot().contextFiles).toEqual([]);
	expect(emit).toHaveBeenCalledWith(FILE_PANEL_EVENTS.FILES_CHANGED, {
		scope: getFilePanelScope({
			type: "INSIGHT",
			insightId: session.insight.insightId,
		}),
		paths: [file.path],
	});
});

it("queues a completed save on the originating chat after navigation", () => {
	const first = new RoomSession("account", "first");
	const second = new RoomSession("account", "second");
	const originalStore = store;
	const emit = vi.spyOn(originalStore.getState().events.actions, "emit");
	const { rerender } = render(view(first));
	const originalHost = host();
	store = createWorkbenchStore({ components: {} });
	rerender(view(second));
	originalHost.onAddToContext?.(file);
	expect(first.getSnapshot().contextFiles).toEqual([
		{ fileName: file.name, fileLocation: file.path },
	]);
	expect(second.getSnapshot().contextFiles).toEqual([]);
	expect(emit).toHaveBeenCalledWith(FILE_PANEL_EVENTS.FILES_CHANGED, {
		scope: getFilePanelScope({
			type: "INSIGHT",
			insightId: first.insight.insightId,
		}),
		paths: [file.path],
	});
});
