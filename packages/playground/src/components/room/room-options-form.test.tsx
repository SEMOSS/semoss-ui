import { fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { expect, test, vi } from "vitest";
import type { RoomStore } from "@/stores/room/room.store";
import { RoomOptionsForm } from "./room-options-form";

vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, args?: { name: string }) =>
			args?.name ? `${key} ${args.name}` : key,
	}),
}));
vi.mock("@/hooks/use-root", () => ({
	useRoot: () => ({ root: { theme: { featureFlags: {} } } }),
}));
vi.mock("@semoss/shared", async (original) => ({
	...(await original<typeof import("@semoss/shared")>()),
	EngineSelect: () => null,
}));
vi.mock("@/components/mcp/mcp-overlay", () => ({
	MCPOverlay: ({
		open,
		defaultTab,
		onClose,
	}: {
		open: boolean;
		defaultTab: string;
		onClose: () => void;
	}) =>
		open ? (
			<div role="dialog" aria-label={defaultTab}>
				<button type="button" onClick={() => onClose()}>
					Cancel
				</button>
			</div>
		) : null,
}));

const options: RoomStore["options"] = {
	instructions: "Keep this instruction",
	predefinedPrompts: [],
	mcp: [
		{ id: "knowledge", name: "Handbook", type: "VECTOR" },
		{ id: "tool", name: "Calculator", type: "FUNCTION" },
		{
			id: "agent",
			name: "Inherited search",
			type: "VECTOR",
			fromWorkspace: true,
		},
		{ id: "room", name: "Room files", type: "ROOM", fromRoom: true },
	],
};
function Settings({ disabled = false }: { disabled?: boolean }) {
	const [value, setValue] = useState(options);
	return (
		<RoomOptionsForm
			model={null}
			onModelChange={vi.fn()}
			options={value}
			onOptionsChange={(next) =>
				setValue((previous) => ({ ...previous, ...next }))
			}
			disabled={disabled}
		/>
	);
}

test("lists separate selected resources and removes only the chosen local selection", () => {
	render(<Settings />);
	const knowledge = screen.getByRole("region", {
		name: "room:form.knowledgeLabel 2",
	});
	const tools = screen.getByRole("region", { name: "room:studio.tools 2" });
	expect(within(knowledge).getByText("Handbook")).toBeVisible();
	expect(within(tools).getByText("Calculator")).toBeVisible();
	expect(
		screen.queryByRole("button", {
			name: /removeSelection Inherited search/,
		}),
	).toBeNull();
	expect(
		screen.queryByRole("button", { name: /removeSelection Room files/ }),
	).toBeNull();
	fireEvent.click(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Handbook",
		}),
	);
	expect(screen.queryByText("Handbook")).toBeNull();
	expect(screen.getByText("Inherited search")).toBeVisible();
	expect(screen.getByText("Calculator")).toBeVisible();
	expect(screen.getByLabelText("room:form.instructionsLabel")).toHaveValue(
		"Keep this instruction",
	);
	expect(
		screen.getByLabelText("room:form.instructionsLabel"),
	).toHaveAttribute("rows", "3");
});

test("routes Add to the right overlay without changing selections on Cancel", () => {
	render(<Settings />);
	for (const [label, tab] of [
		["room:menuKnowledge.addKnowledge", "KNOWLEDGE"],
		["room:menuToolbox.addToolbox", "TOOLBOX"],
	]) {
		fireEvent.click(screen.getByRole("button", { name: label }));
		expect(screen.getByRole("dialog", { name: tab })).toBeVisible();
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
	}
	expect(screen.getByText("Handbook")).toBeVisible();
	expect(screen.getByText("Calculator")).toBeVisible();
});

test("running chats keep selections visible and disable all edits", () => {
	render(<Settings disabled />);
	expect(screen.getByText("Handbook")).toBeVisible();
	expect(
		screen.getByRole("button", {
			name: "room:settings.removeSelection Handbook",
		}),
	).toBeDisabled();
	expect(
		screen.getByRole("button", { name: "room:menuKnowledge.addKnowledge" }),
	).toBeDisabled();
	expect(screen.getByLabelText("room:form.instructionsLabel")).toBeDisabled();
});
