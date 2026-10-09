import {
	act,
	cleanup,
	fireEvent,
	render,
	screen,
} from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ProjectSelect } from "@semoss/shared";
import { createWorkbenchStore } from "@semoss/workbench";
import { AssistantStoreProvider } from "@/contexts/assistant.context";
import { createAssistantStore } from "@/stores/assistant/assistant.store";
import { DATABASE_EXPLORER_AGENT } from "@/stores/assistant/assistant-agents";
import { AssistantSettings } from "./assistant-settings";

// Catalog transport belongs to the shared picker; exercise this view's store
// wiring without contacting MyProjects or MyEngines.
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => null,
	ProjectSelect: ({
		name,
		onChange,
		id,
		"aria-describedby": describedBy,
	}: ComponentProps<typeof ProjectSelect>) => (
		<button
			id={id}
			aria-describedby={describedBy}
			type="button"
			onClick={() =>
				onChange({
					project_id: "custom-agent",
					project_name: "My analyst",
					project_type: "WORKSPACE",
				})
			}
		>
			{name}
		</button>
	),
}));

afterEach(cleanup);

describe("assistant agent settings", () => {
	it("shows the workbench default, keeps a custom choice on refresh, and resets through Use default", () => {
		const store = createAssistantStore({
			workbenchId: "database-1",
			workbench: createWorkbenchStore({ components: {} }),
		});
		store.getState().configure({ defaultAgent: DATABASE_EXPLORER_AGENT });
		render(
			<AssistantStoreProvider store={store}>
				<AssistantSettings />
			</AssistantStoreProvider>,
		);
		expect(screen.getByLabelText("Agent")).toHaveTextContent(
			"Database Explorer",
		);
		expect(
			screen.queryByRole("button", { name: "Use default" }),
		).not.toBeInTheDocument();
		fireEvent.click(screen.getByLabelText("Agent"));
		expect(screen.getByLabelText("Agent")).toHaveTextContent("My analyst");
		act(() =>
			store
				.getState()
				.configure({ defaultAgent: DATABASE_EXPLORER_AGENT }),
		);
		expect(screen.getByLabelText("Agent")).toHaveTextContent("My analyst");
		fireEvent.click(screen.getByRole("button", { name: "Use default" }));
		expect(screen.getByLabelText("Agent")).toHaveTextContent(
			"Database Explorer",
		);
		expect(screen.getByLabelText("Agent")).toHaveAccessibleDescription(
			/Changes apply to your next message/,
		);
		expect(store.getState().agent).toBeNull();
		store.getState().destroy();
	});
});
