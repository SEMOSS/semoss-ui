import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { createInitialCollaborationState } from "@/features/collaboration/state/collaboration.fixtures";
import type { CollaborationState } from "@/features/collaboration/state/collaboration.types";
import { CollaborationSessionProvider } from "@/features/collaboration/state/collaboration-session.context";
import { setThreadAgent } from "@/features/thread-assistant/thread-context";
import {
	MAIN_TWIN_PRIVACY,
	MAIN_TWIN_REACH,
	useChatAgent,
	useMainTwin,
} from "./use-main-twin";

const SEEDED = "collaboration-agent";
const PICTURE = "data:image/png;base64,AAAA";
const BASE = createInitialCollaborationState();
const ROBIN: CollaborationState = {
	...BASE,
	liveProfile: { ...BASE.profile, email: "robin@northwind.example" },
	mainTwin: { name: "Robin's Digital Twin", avatar: "", agentId: SEEDED },
};

/** Render a hook inside a session that holds `state`; with none, there is no session. */
const withSession = (state?: CollaborationState) =>
	state
		? {
				wrapper: ({ children }: { children: ReactNode }) => (
					<CollaborationSessionProvider initialState={state}>
						{children}
					</CollaborationSessionProvider>
				),
			}
		: undefined;

afterEach(() => setThreadAgent(null));

describe("useMainTwin", () => {
	it("shows the picture the person chose, else their Microsoft photo, else none", () => {
		const chosen = renderHook(
			useMainTwin,
			withSession({
				...ROBIN,
				mainTwin: { name: "Rob", avatar: PICTURE, agentId: SEEDED },
			}),
		).result.current;
		expect(chosen).toEqual({
			name: "Rob",
			avatar: PICTURE,
			isSaved: true,
			agentId: SEEDED,
		});

		const photo = renderHook(useMainTwin, withSession(ROBIN)).result
			.current;
		expect(photo.name).toBe("Robin's Digital Twin");
		expect(photo.avatar).toMatch(
			/\/msgraph\/photo\?email=robin%40northwind\.example$/,
		);
		expect(photo.isSaved).toBe(false);

		// nobody signed in with Microsoft: no address to ask a photo for
		expect(
			renderHook(
				useMainTwin,
				withSession({ ...ROBIN, liveProfile: null }),
			).result.current.avatar,
		).toBeUndefined();
	});

	it('is "Your Digital Twin" on a server that predates it and outside a session, still on the seeded agent', () => {
		setThreadAgent({
			id: SEEDED,
			name: "Collaboration Agent",
			modelId: "",
		});
		const older = renderHook(
			useMainTwin,
			withSession({ ...ROBIN, mainTwin: undefined }),
		).result.current;
		expect(older.name).toBe("Your Digital Twin");
		// the photo still stands in, and the settings' agent is still the one that runs it
		expect(older.avatar).toMatch(/\/msgraph\/photo\?email=/);
		expect(older.agentId).toBe(SEEDED);

		expect(renderHook(useMainTwin).result.current).toEqual({
			name: "Your Digital Twin",
			avatar: undefined,
			isSaved: false,
			agentId: SEEDED,
		});
	});
});

describe("useChatAgent", () => {
	const robinsTwin = {
		name: "Robin's Digital Twin",
		avatar: expect.stringMatching(/\/msgraph\/photo/),
		kind: "mainTwin",
	};
	const chat = (
		input: Parameters<typeof useChatAgent>[0],
		state: CollaborationState | undefined = ROBIN,
	) =>
		renderHook(() => useChatAgent(input), withSession(state)).result
			.current;

	it("is the person's own twin for a chat with no agent", () => {
		expect(chat({ agentId: "" })).toEqual(robinsTwin);
		expect(chat({ agentId: "", agent: null, options: null })).toEqual(
			robinsTwin,
		);
	});

	it("is the person's own twin for the seeded agent, whatever that agent is called", () => {
		expect(
			chat({ agentId: SEEDED, agent: { name: "Collaboration Agent" } }),
		).toEqual(robinsTwin);
		// a room's saved options alone do not make it someone else's
		expect(
			chat({
				agentId: SEEDED,
				agent: { name: "Collaboration Agent" },
				options: { modelId: "model-1" },
			}),
		).toEqual(robinsTwin);
	});

	it("keeps another agent itself: its own name, no twin picture", () => {
		expect(
			chat({
				agentId: "research",
				agent: { name: "Research assistant" },
			}),
		).toEqual({
			name: "Research assistant",
			avatar: undefined,
			kind: "agent",
		});
		// before it has loaded it is an agent, never the seeded agent's name
		expect(chat({ agentId: "research", agent: null })).toEqual({
			name: "Agent",
			avatar: undefined,
			kind: "agent",
		});
	});

	it("is never the person's own twin in a delegated task's room", () => {
		const options = { delegation_action_id: "action-1" };
		// the seeded agent's own name is never shown, here either
		const delegated = {
			name: "Agent",
			avatar: undefined,
			kind: "delegation",
		};
		expect(
			chat({
				agentId: SEEDED,
				agent: { name: "Collaboration Agent" },
				options,
			}),
		).toEqual(delegated);
		expect(chat({ agentId: "", options })).toEqual(delegated);
		// another agent keeps its own name there
		expect(
			chat({
				agentId: "research",
				agent: { name: "Research assistant" },
				options,
			}),
		).toEqual({ ...delegated, name: "Research assistant" });
	});

	it("reads the delegation mark as the server does: a blank one is the person's own chat", () => {
		for (const mark of ["", "  ", null, undefined])
			expect(
				chat({ agentId: "", options: { delegation_action_id: mark } }),
			).toEqual(robinsTwin);
		// any other value is a mark, as the server takes it
		expect(
			chat({ agentId: "", options: { delegation_action_id: 7 } }).kind,
		).toBe("delegation");
	});

	it("is never the person's own twin on a page that is another agent's own, even before that agent is applied", () => {
		// the draft starts on the seeded agent: it is a Digital Twin with no name or picture yet
		const pending = {
			name: "Digital Twin",
			avatar: undefined,
			kind: "agent",
		};
		expect(chat({ agentId: "", isOwnPage: true })).toEqual(pending);
		expect(
			chat({
				agentId: SEEDED,
				agent: { name: "Collaboration Agent" },
				isOwnPage: true,
			}),
		).toEqual(pending);
		// once the agent the address names is applied, it is that agent
		expect(
			chat({
				agentId: "twin-dana",
				agent: { name: "Renewals Twin" },
				isOwnPage: true,
			}),
		).toEqual({ name: "Renewals Twin", avatar: undefined, kind: "agent" });
	});

	it("knows the seeded agent from the settings on a server that sends no twin, and only a blank id when it names none", () => {
		const older = { ...ROBIN, mainTwin: undefined };
		// no seeded agent known: only a chat with no agent is the person's own twin
		expect(chat({ agentId: SEEDED }, older).kind).toBe("agent");
		expect(chat({ agentId: "" }, older)).toMatchObject({
			name: "Your Digital Twin",
			kind: "mainTwin",
		});
		setThreadAgent({
			id: SEEDED,
			name: "Collaboration Agent",
			modelId: "",
		});
		expect(chat({ agentId: SEEDED }, older)).toMatchObject({
			name: "Your Digital Twin",
			kind: "mainTwin",
		});
	});
});

it("says the two things about a person's own twin the same way everywhere", () => {
	expect(MAIN_TWIN_PRIVACY).toBe("Private to you");
	expect(MAIN_TWIN_REACH).toBe(
		"Works with your mail, Teams, calendar, files, work and routines.",
	);
});
