import { act, render } from "@testing-library/react";
import type { ConnectorViewerProps } from "@semoss/connectors";
import { FILE_PANEL_EVENTS } from "@semoss/panels";
import { createWorkbenchStore, WorkbenchProvider } from "@semoss/workbench";
import { connectorViewerPanel } from "./connector-viewer-panel";
import { ONEDRIVE_BROWSER_PANEL } from "./room-connectors.constants";

// one object, so the panel does not see a new host on every render
const panel = vi.hoisted(() => ({ host: {}, isReady: true }));
vi.mock("./use-connector-panel", () => ({
	useConnectorPanel: () => panel,
}));

it("asks its viewer to read again when a run finishes, not when a viewer saves a file", () => {
	const requests: (number | undefined)[] = [];
	const Panel = connectorViewerPanel((props: ConnectorViewerProps) => {
		requests.push(props.refreshRequestId);
		return null;
	});
	const store = createWorkbenchStore({ components: {} });
	render(
		<WorkbenchProvider store={store}>
			<Panel id={ONEDRIVE_BROWSER_PANEL} />
		</WorkbenchProvider>,
	);
	const emit = (paths?: string[]) =>
		act(() =>
			store
				.getState()
				.events.actions.emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
					scope: "insight:origin",
					paths,
				}),
		);
	expect(requests.at(-1)).toBe(0);

	// a viewer's own save names the file, and changes nothing in the drive
	emit(["Budget.xlsx"]);
	expect(requests.at(-1)).toBe(0);

	// a finished run names none: it may have written to the drive as well
	emit();
	expect(requests.at(-1)).toBe(1);
	emit();
	expect(requests.at(-1)).toBe(2);
});
