import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { ChatProvider } from "@semoss/chat";
import { AgentCatalog } from "@/features/agents/agent-catalog";

/** The stubs the mocked modules call, reset before each test. */
const mocks = vi.hoisted(() => ({ pixel: "", navigate: vi.fn() }));
vi.mock("@/features/theme/use-playground-theme", () => ({
	usePlaygroundTheme: () => ({ images: {} }),
}));
vi.mock("@semoss/i18n", () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("react-router", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@semoss/ui/next", async (original) => ({
	...(await original<typeof import("@semoss/ui/next")>()),
	useTheme: () => ({ theme: "light" }),
	useDebouncedValue: (value: string) => value,
}));
vi.mock("@semoss/sdk/react", () => ({
	// the chat reads the session's models as it starts; there are none
	Session: {
		insight: { withInsight: async () => [] },
		getSnapshot: () => ({ user: null }),
	},
	useSessionIteratorPixel: (
		buildPixel: (limit: number, offset: number) => string,
	) => {
		mocks.pixel = buildPixel(25, 0);
		return {
			data: [
				{
					project_id: "group",
					project_name: "Group agent",
					permission: 2,
					user_permission: 3,
				},
				{
					project_id: "global",
					project_name: "Global agent",
					user_permission: 1,
				},
			],
			isLoading: false,
			hasMore: false,
		};
	},
}));
vi.mock("@/features/agents/workspace-card", () => ({
	WorkspaceCard: ({
		workspace,
		permission,
	}: {
		workspace: { name: string };
		permission: string;
	}) => (
		<div>
			{workspace.name}: {permission}
		</div>
	),
}));

/** The chat's provider the pages read from, with the options they need. */
const chatWrapper = ({ children }: { children: ReactNode }) => (
	<ChatProvider
		config={{
			options: {
				roomHref: (roomId) => `#/room/${roomId}`,
			},
			callbacks: { onOpenRoom: vi.fn(), onOpenNewChat: vi.fn() },
		}}
	>
		{children}
	</ChatProvider>
);

// jsdom has no scrollIntoView, which the sort select calls; stub it per test
// and put back whatever was there
const scrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(
	HTMLElement.prototype,
	"scrollIntoView",
);
beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
		configurable: true,
		value: vi.fn(),
	});
});
afterEach(() => {
	if (scrollIntoViewDescriptor)
		Object.defineProperty(
			HTMLElement.prototype,
			"scrollIntoView",
			scrollIntoViewDescriptor,
		);
	else Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
});

test("catalog uses effective permissions for group and global agents", () => {
	render(<AgentCatalog />, { wrapper: chatWrapper });
	expect(screen.getByText("Group agent: EDIT")).toBeInTheDocument();
	expect(screen.getByText("Global agent: READ_ONLY")).toBeInTheDocument();
	expect(mocks.pixel).not.toContain("effectivePermissions");
});

test("catalog combines access filters, search, and sorting in the existing page", async () => {
	const user = userEvent.setup();
	render(<AgentCatalog />, { wrapper: chatWrapper });
	await user.click(
		screen.getByRole("button", { name: "workspace:catalog.filters.owner" }),
	);
	await user.click(
		screen.getByRole("button", { name: "workspace:catalog.filters.edit" }),
	);
	await user.click(
		screen.getByRole("button", {
			name: "workspace:catalog.filters.createdByMe",
		}),
	);
	fireEvent.change(
		screen.getByRole("textbox", { name: "common:buttons.search" }),
		{ target: { value: "Research" } },
	);
	fireEvent.keyDown(
		screen.getByRole("combobox", { name: "workspace:catalog.sort.label" }),
		{ key: "Enter" },
	);
	fireEvent.click(
		await screen.findByRole("option", {
			name: "workspace:catalog.sort.newest",
		}),
	);
	expect(mocks.pixel).toContain("effectivePermissions=[1,2]");
	expect(mocks.pixel).toContain("createdByMe=[true]");
	expect(mocks.pixel).toContain("<encode>Research</encode>");
	expect(mocks.pixel).toContain('sort=[{"DATECREATED": "DESC"}]');
});
