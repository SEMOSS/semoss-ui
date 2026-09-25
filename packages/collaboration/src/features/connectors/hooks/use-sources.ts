import { useEffect, useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	connectMicrosoft,
	getCalendarEvent,
	getMail,
	getTeamsMessages,
	listCalendarEvents,
	listMail,
	listMailFolders,
	listTeamsChats,
} from "../api/microsoft";
import type {
	CalendarEvent,
	OutlookFolder,
	OutlookMail,
	TeamsChat,
} from "../api/microsoft-schemas";
import {
	importCalendarEvent,
	importOutlookMail,
	importTeamsChat,
} from "../api/source-mapping";
import type { ImportedSource, MailSearchFilters } from "../types";

type SourceArea = "mail" | "teams" | "calendar" | "selection" | "connection";
interface LoadState {
	isLoading: boolean;
	error: string | null;
	hasLoaded: boolean;
}
const emptyLoad: LoadState = {
	isLoading: false,
	error: null,
	hasLoaded: false,
};

interface SourcesResult {
	mail: OutlookMail[];
	folders: OutlookFolder[];
	chats: TeamsChat[];
	events: CalendarEvent[];
	selected: ImportedSource | null;
	loads: Record<SourceArea, LoadState>;
	folderError: string | null;
	loadMail: (filters: MailSearchFilters) => Promise<void>;
	loadTeams: () => Promise<void>;
	loadCalendar: () => Promise<void>;
	selectMail: (uid: string) => Promise<void>;
	selectChat: (chat: TeamsChat) => Promise<void>;
	selectEvent: (id: string) => Promise<void>;
	connect: () => Promise<void>;
}

/** Own independent, user-triggered source requests and discard stale selections after navigation. */
export function useSources(): SourcesResult {
	const { actions } = useInsight();
	const [mail, setMail] = useState<OutlookMail[]>([]);
	const [folders, setFolders] = useState<OutlookFolder[]>([]);
	const [chats, setChats] = useState<TeamsChat[]>([]);
	const [events, setEvents] = useState<CalendarEvent[]>([]);
	const [selected, setSelected] = useState<ImportedSource | null>(null);
	const [folderError, setFolderError] = useState<string | null>(null);
	const [loads, setLoads] = useState<Record<SourceArea, LoadState>>({
		mail: emptyLoad,
		teams: emptyLoad,
		calendar: emptyLoad,
		selection: emptyLoad,
		connection: emptyLoad,
	});
	const folder = useRef("inbox");
	const generation = useRef<Record<SourceArea, number>>({
		mail: 0,
		teams: 0,
		calendar: 0,
		selection: 0,
		connection: 0,
	});

	useEffect(() => {
		const activeGeneration = generation.current;
		return () => {
			for (const area of Object.keys(activeGeneration) as SourceArea[])
				activeGeneration[area] += 1;
		};
	}, []);

	async function request<T>(
		area: SourceArea,
		task: () => Promise<T>,
		commit: (data: T) => void,
	): Promise<void> {
		const token = ++generation.current[area];
		setLoads((current) => ({
			...current,
			[area]: { ...current[area], isLoading: true, error: null },
		}));
		try {
			const result = await task();
			if (token !== generation.current[area]) return;
			commit(result);
			setLoads((current) => ({
				...current,
				[area]: { isLoading: false, error: null, hasLoaded: true },
			}));
		} catch (cause: unknown) {
			if (token !== generation.current[area]) return;
			setLoads((current) => ({
				...current,
				[area]: {
					...current[area],
					isLoading: false,
					error:
						cause instanceof Error
							? cause.message
							: "This source could not be loaded.",
				},
			}));
		}
	}

	async function loadMail(filters: MailSearchFilters): Promise<void> {
		await request(
			"mail",
			async () => {
				// Preserve a usable message page when a separately optional folder lookup fails.
				const results = await Promise.allSettled([
					listMail(actions, filters),
					listMailFolders(actions),
				]);
				const messages = results[0];
				if (messages.status === "rejected") throw messages.reason;
				return {
					page: messages.value,
					folders:
						results[1].status === "fulfilled"
							? results[1].value.folders
							: null,
				};
			},
			(result) => {
				setMail(result.page.messages);
				folder.current = result.page.folder;
				if (result.folders) setFolders(result.folders);
				setFolderError(
					result.folders
						? null
						: "Custom folders could not be loaded. You can still read the loaded messages and search Inbox, Sent Items, or Drafts.",
				);
			},
		);
	}

	async function loadTeams(): Promise<void> {
		await request(
			"teams",
			() => listTeamsChats(actions),
			(page) => setChats(page.chats),
		);
	}
	async function loadCalendar(): Promise<void> {
		await request(
			"calendar",
			() => listCalendarEvents(actions),
			(page) => setEvents(page.events),
		);
	}
	async function selectMail(uid: string): Promise<void> {
		const selectedFolder = folder.current;
		await request(
			"selection",
			async () =>
				importOutlookMail(await getMail(actions, uid), selectedFolder),
			setSelected,
		);
	}
	async function selectChat(chat: TeamsChat): Promise<void> {
		await request(
			"selection",
			async () =>
				importTeamsChat(chat, await getTeamsMessages(actions, chat.id)),
			setSelected,
		);
	}
	async function selectEvent(id: string): Promise<void> {
		await request(
			"selection",
			async () =>
				importCalendarEvent(await getCalendarEvent(actions, id)),
			setSelected,
		);
	}
	async function connect(): Promise<void> {
		await request(
			"connection",
			() => connectMicrosoft(),
			() => undefined,
		);
	}

	return {
		mail,
		folders,
		chats,
		events,
		selected,
		loads,
		folderError,
		loadMail,
		loadTeams,
		loadCalendar,
		selectMail,
		selectChat,
		selectEvent,
		connect,
	};
}
