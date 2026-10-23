import {
	cleanup,
	render,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToolViewProvider, useToolView } from "@semoss/shared";
import gmailLogo from "@semoss/shared/assets/img/connectors/gmail.svg?url";
import googleCalendarLogo from "@semoss/shared/assets/img/connectors/google-calendar.svg?url";
import type { ToolStore } from "@/stores/tool/tool.store";
import { ComponentToolView } from "./component-tool-view";
import { TOOL_VIEW_LIBRARIES } from "./tool-view-libraries";

const decisions = vi.hoisted(() => ({
	onApprove: vi.fn().mockResolvedValue(undefined),
	onDecline: vi.fn().mockResolvedValue(undefined),
	onRespond: vi.fn().mockResolvedValue(undefined),
}));
const host = vi.hoisted(() => vi.fn(() => ({})));
vi.mock("./tool-view-decisions", () => ({
	createToolViewDecisions: () => decisions,
}));
vi.mock("./use-room-tool-view-host", () => ({ useRoomToolViewHost: host }));
vi.mock("@semoss/sdk/react", () => ({
	useInsight: () => ({ insightId: "test" }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({
		t: (key: string, values?: { label?: string }) => values?.label ?? key,
		i18n: { language: "en" },
	}),
}));

interface ResolvedViewProps {
	/** Resource selected by the tool's metadata. */
	uri: string;
	/** Host placement, both of which share the same registry and callbacks. */
	variant: "inline" | "panel";
	/** Execution data, kept separate from URI configuration. */
	args: Record<string, unknown>;
}

/** Exercise the host with its actual lazy connector registrations and forms. */
function ResolvedView({ uri, variant, args }: ResolvedViewProps) {
	const view = useToolView(uri);
	const tool = {
		id: "renamed-call",
		status: "INITIAL",
		parameters: args,
		response: "",
		room: { mode: "chat" },
		message: {},
		json: {
			name: "RenamedTool",
			_meta: {
				SMSS_FUNCTION_NAME: "RenamedImplementation",
				SMSS_MCP_EXECUTION: "ask",
				SMSS_MCP_UI: { resourceURI: uri },
			},
		},
	} as unknown as ToolStore;
	return view ? (
		<ComponentToolView
			tool={tool}
			view={view}
			variant={variant}
			fallback="Generic view"
		/>
	) : (
		<span>Generic view</span>
	);
}

function draw(props: ResolvedViewProps) {
	return render(
		<ToolViewProvider libraries={TOOL_VIEW_LIBRARIES}>
			<ResolvedView {...props} />
		</ToolViewProvider>,
	);
}

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe.each(["inline", "panel"] as const)(
	"flat connector views in %s",
	(variant) => {
		it("uses mail URI provider and intent, preserves edits, and approves execution arguments only", async () => {
			decisions.onApprove.mockRejectedValueOnce(new Error("Try again"));
			draw({
				variant,
				uri: "component://mail-compose?provider=google&intent=draft&subject=config%20only",
				args: {
					to: ["ada@example.com"],
					subject: "Original subject",
					body: "Hello",
				},
			});
			const region = await screen.findByRole("region", {
				name: "toolViews.mail.draftTitle",
			});
			expect(within(region).getByAltText("").getAttribute("src")).toBe(
				gmailLogo,
			);
			expect(host).toHaveBeenCalledWith({
				provider: "google",
				intent: "draft",
				subject: "config only",
			});
			const subject = screen.getByRole("textbox", {
				name: "toolViews.mail.subject",
			});
			expect(subject).toHaveValue("Original subject");
			await userEvent.clear(subject);
			await userEvent.type(subject, "Reviewed subject");
			await userEvent.click(
				screen.getByRole("button", {
					name: "toolViews.mail.saveDraft",
				}),
			);
			expect(await screen.findByRole("alert")).toHaveTextContent(
				"Try again",
			);
			expect(subject).toHaveValue("Reviewed subject");
			await userEvent.click(
				screen.getByRole("button", {
					name: "toolViews.mail.saveDraft",
				}),
			);
			await waitFor(() =>
				expect(decisions.onApprove).toHaveBeenCalledTimes(2),
			);
			expect(decisions.onApprove).toHaveBeenLastCalledWith({
				to: ["ada@example.com"],
				cc: [],
				bcc: [],
				subject: "Reviewed subject",
				body: "Hello",
			});
		});

		it("uses calendar URI provider and intent and preserves denial", async () => {
			draw({
				variant,
				uri: "component://calendar-event-edit?provider=google&intent=create",
				args: { subject: "Meeting" },
			});
			const region = await screen.findByRole("region", {
				name: "toolViews.calendar.createTitle",
			});
			expect(within(region).getByAltText("").getAttribute("src")).toBe(
				googleCalendarLogo,
			);
			expect(
				screen.getByRole("textbox", {
					name: "toolViews.calendar.subject",
				}),
			).toHaveValue("Meeting");
			await userEvent.click(
				screen.getByRole("button", { name: "toolViews.deny" }),
			);
			expect(decisions.onDecline).toHaveBeenCalledOnce();
			expect(decisions.onApprove).not.toHaveBeenCalled();
		});
	},
);

it.each([
	"component://mail/compose",
	"component://unknown",
	"component:/mail-compose",
])("uses the generic view for unsupported URI %s", (uri) => {
	draw({ uri, variant: "inline", args: {} });
	expect(screen.getByText("Generic view")).toBeVisible();
	expect(host).not.toHaveBeenCalled();
});
