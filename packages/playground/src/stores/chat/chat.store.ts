import { createStore } from "zustand/vanilla";
import type { Insight } from "@semoss/sdk/react";
import { runPixel } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import type { Engine, MCPConfig, Workspace } from "@/types";
import { RoomStore } from "../room";

const DEFAUlT_MODEL_ID = import.meta.env.VITE_DEFAUlT_MODEL_ID || "";
const DEFAUlT_MODEL_NAME = import.meta.env.VITE_DEFAUlT_MODEL_NAME || "";
const SESSION_MODEL_KEY = "smss-playground-session-model";

export interface OptimisticRoom {
	ROOM_ID: string;
	ROOM_NAME: string;
	DATE_CREATED: string;
	WORKSPACE_ID?: string;
	PINNED?: boolean;
}

export interface ChatState {
	isInitialized: boolean;
	models: {
		selected: Engine;
		contextWindow?: number;
	};
	profileDefaultModelId: string;
	rooms: Record<string, RoomStore>;
	optimisticRooms: Record<string, OptimisticRoom>;
	keys: { roomCounter: number };
	embeddedPageMap: Record<
		string,
		| ThemeMap["playground"]["sidebar"]["headerItems"][number]
		| ThemeMap["playground"]["sidebar"]["footerItems"][number]
	>;
	user: { id: string; name: string; lastLogin?: string };
	/** Actions */
	initialize: () => Promise<void>;
	registerRoom: (room: RoomStore) => void;
	addOptimisticRoom: (room: OptimisticRoom) => void;
	removeOptimisticRoom: (roomId: string) => void;
	incrementRoomCounter: () => void;
	createRoom: (
		mode: "agent" | "chat",
		prompt: string,
		files: File[],
		options: RoomStore["options"],
		workspaceId?: string,
	) => Promise<RoomStore>;
	closeRoom: (roomId: string) => Promise<void>;
	renameRoom: (roomId: string, name: string) => Promise<void>;
	pinRoom: (roomId: string, pinned: boolean) => Promise<void>;
	loadRoom: (roomId: string) => Promise<RoomStore>;
	setSelectedModel: (model: Engine) => void;
	addWorkspace: (
		data: Pick<
			Workspace,
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "skills"
			| "prompts"
		>,
	) => Promise<string>;
	editWorkspace: (
		workspaceId: string,
		data: Pick<
			Workspace,
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "skills"
			| "prompts"
		>,
	) => Promise<string>;
	deleteWorkspace: (workspaceId: string) => Promise<void>;
}

export const createChatStore = (
	theme: ThemeMap["playground"],
	actions: Insight["actions"],
) => {
	const embeddedPageMap = [
		...theme.sidebar.headerItems,
		...theme.sidebar.footerItems,
	]
		.filter((item) => item.embed && item.url)
		.reduce(
			(acc, item) => {
				acc[item.path] = item;
				return acc;
			},
			{} as ChatState["embeddedPageMap"],
		);

	const store = createStore<ChatState>()((set, get) => {
		const getUser = async () => {
			try {
				const result = await actions.run<
					[
						Record<
							string,
							{
								id: string;
								name: string;
								lastLogin?: string;
								meta?: Record<string, unknown>;
							}
						>,
					]
				>(`META | GetUserInfo();`);
				if (!result) return;
				const providerData = Object.values(
					result.pixelReturn[0].output,
				)[0];
				if (!providerData) return;
				set({
					user: {
						id: providerData.id,
						name: providerData.name,
						lastLogin: providerData.lastLogin,
					},
				});
				const metaValue = providerData.meta?.["text-generation-model"];
				const profileDefaultModelId = Array.isArray(metaValue)
					? (metaValue[0] as string) || ""
					: typeof metaValue === "string"
						? metaValue
						: "";
				set({ profileDefaultModelId });
			} catch (e) {
				console.error(e);
			}
		};

		const loadEngineContextWindow = async (engineId: string) => {
			set((s) => ({
				models: { ...s.models, contextWindow: undefined },
			}));
			const { pixelReturn } = await actions.run<[number | undefined]>(
				`META | GetContextWindow(${JSON.stringify(engineId)});`,
			);
			if (get().models.selected?.engine_id === engineId) {
				set((s) => ({
					models: {
						...s.models,
						contextWindow: pixelReturn[0].output,
					},
				}));
			}
		};

		const setSelectedModel = (model: Engine) => {
			set((s) => ({ models: { ...s.models, selected: model } }));
			sessionStorage.setItem(
				SESSION_MODEL_KEY,
				JSON.stringify({ model, lastLogin: get().user.lastLogin }),
			);
			loadEngineContextWindow(model.engine_id);
		};

		const getDefaultModel = async () => {
			const defaultModelId =
				theme.defaultRoomSettings?.model?.engine_id || DEFAUlT_MODEL_ID;
			const defaultModelName =
				theme.defaultRoomSettings?.model?.engine_display_name ||
				theme.defaultRoomSettings?.model?.engine_name ||
				DEFAUlT_MODEL_NAME;

			if (!theme.featureFlags?.enableModelSelect) {
				setSelectedModel({
					engine_id: defaultModelId,
					engine_name: defaultModelName,
					engine_type: "MODEL",
				});
				return;
			}

			const { pixelReturn } = await actions.run<[Engine[]]>(
				`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
			);

			const { output } = pixelReturn[0];
			const profileDefaultModelId = get().profileDefaultModelId;
			let isSelected = false;

			if (profileDefaultModelId) {
				for (const m of output) {
					if (m.engine_id === profileDefaultModelId) {
						setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			if (!isSelected) {
				try {
					const sessionItem =
						sessionStorage.getItem(SESSION_MODEL_KEY);
					if (sessionItem) {
						const { model: sessionModel, lastLogin: storedLogin } =
							JSON.parse(sessionItem) as {
								model: Engine;
								lastLogin?: string;
							};
						const currentLogin = get().user.lastLogin;
						if (
							storedLogin &&
							currentLogin &&
							storedLogin === currentLogin
						) {
							for (const m of output) {
								if (m.engine_id === sessionModel.engine_id) {
									setSelectedModel(m);
									isSelected = true;
									break;
								}
							}
						}
					}
				} catch {}
			}

			if (!isSelected && defaultModelId) {
				for (const m of output) {
					if (m.engine_id === defaultModelId) {
						setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			if (!isSelected && output.length > 0) {
				setSelectedModel(output[0]);
			}
		};

		return {
			isInitialized: false,
			models: {
				selected: null as unknown as Engine,
				contextWindow: undefined,
			},
			profileDefaultModelId: "",
			rooms: {},
			optimisticRooms: {},
			keys: { roomCounter: 0 },
			embeddedPageMap,
			user: { id: "", name: "" },

			initialize: async () => {
				try {
					await getUser();
					await getDefaultModel();
				} catch (e) {
					console.error(e);
				} finally {
					set({ isInitialized: true });
				}
			},

			registerRoom: (room: RoomStore) => {
				set((s) => ({ rooms: { ...s.rooms, [room.roomId]: room } }));
			},

			addOptimisticRoom: (room: OptimisticRoom) => {
				set((s) => ({
					optimisticRooms: {
						...s.optimisticRooms,
						[room.ROOM_ID]: room,
					},
				}));
			},

			removeOptimisticRoom: (roomId: string) => {
				set((s) => {
					const next = { ...s.optimisticRooms };
					delete next[roomId];
					return { optimisticRooms: next };
				});
			},

			incrementRoomCounter: () => {
				set((s) => ({
					keys: { ...s.keys, roomCounter: s.keys.roomCounter + 1 },
				}));
			},

			createRoom: async (mode, prompt, files, options, workspaceId) => {
				const { errors, pixelReturn, insightId } = await runPixel<
					[{ roomId: string }]
				>(
					`CreatePlaygroundRoom(${workspaceId ? `workspaceId=${JSON.stringify(workspaceId)}` : ""})`,
					"new",
				);
				if (errors.length > 0) throw new Error(errors.join(""));
				const { output } = pixelReturn[0];
				const roomId = output.roomId;

				const room = new RoomStore(theme, roomId, insightId);
				room.setModel(get().models.selected);
				room.setMode(mode);
				room.setMetadata({ name: prompt.substring(0, 15) });
				await room.initialize();
				await room.updateRoomOptions(options);

				set((s) => ({
					rooms: { ...s.rooms, [roomId]: room },
					optimisticRooms: {
						...s.optimisticRooms,
						[roomId]: {
							ROOM_ID: roomId,
							ROOM_NAME: prompt.substring(0, 100),
							DATE_CREATED: new Date().toISOString(),
							WORKSPACE_ID: workspaceId,
						},
					},
					keys: { ...s.keys, roomCounter: s.keys.roomCounter + 1 },
				}));

				(async () => {
					try {
						await room.askMessage(prompt, files);
						set((s) => ({
							keys: {
								...s.keys,
								roomCounter: s.keys.roomCounter + 1,
							},
						}));
					} catch {
						get().removeOptimisticRoom(roomId);
					}
				})();

				return room;
			},

			closeRoom: async (roomId: string) => {
				const room = get().rooms[roomId];
				const insightId = room?.insightId;
				await actions.run<[boolean]>(
					`RemoveUserRoom(roomId=["${roomId}"]);`,
				);
				if (insightId && insightId !== "new") {
					try {
						await runPixel<[Record<string, unknown>]>(
							"DropInsight()",
							insightId,
						);
					} catch (e) {
						console.warn(e);
					}
				}
				set((s) => {
					const next = { ...s.rooms };
					delete next[roomId];
					return {
						rooms: next,
						keys: {
							...s.keys,
							roomCounter: s.keys.roomCounter + 1,
						},
					};
				});
			},

			renameRoom: async (roomId: string, name: string) => {
				const trimmed = name.trim();
				if (!trimmed) throw new Error("Room name cannot be empty");
				await actions.run<[boolean]>(
					`META | RenameRoom(roomId=["${roomId}"], name=["<encode>${trimmed}</encode>"]);`,
				);
				const cached = get().rooms[roomId];
				if (cached) cached.setMetadata({ name: trimmed });
				set((s) => ({
					keys: { ...s.keys, roomCounter: s.keys.roomCounter + 1 },
				}));
			},

			pinRoom: async (roomId: string, pinned: boolean) => {
				await actions.run<[boolean]>(
					`PinRoom(roomId=["${roomId}"], pinned=[${pinned}]);`,
				);
				set((s) => ({
					keys: { ...s.keys, roomCounter: s.keys.roomCounter + 1 },
				}));
			},

			loadRoom: async (roomId: string) => {
				if (get().rooms[roomId]) return get().rooms[roomId];
				const room = new RoomStore(theme, roomId);
				await room.initialize();
				if (!room.tail || room.tail.id === "ROOT_PLACEHOLDER_ID") {
					throw new Error("Room not found");
				}
				set((s) => ({ rooms: { ...s.rooms, [roomId]: room } }));
				return room;
			},

			setSelectedModel,

			addWorkspace: async (data) => {
				try {
					const mcp = data.mcp.map(
						({ name, id, type }): MCPConfig => ({ name, id, type }),
					);
					const skills = data.skills.map((s) => s.id);
					const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
					const { pixelReturn } = await actions.run<[string]>(pixel);
					return pixelReturn[0].output;
				} catch (e) {
					throw e instanceof Error ? e : new Error(String(e));
				}
			},

			editWorkspace: async (workspaceId, data) => {
				try {
					const mcp = data.mcp.map(
						({ name, id, type }): MCPConfig => ({ name, id, type }),
					);
					const skills = data.skills.map((s) => s.id);
					const pixel = `EditWorkspace(workspaceId=${JSON.stringify(workspaceId)}, name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
					const { pixelReturn } = await actions.run<[string]>(pixel);
					if (!pixelReturn[0].output) throw new Error();
					return workspaceId;
				} catch (e) {
					throw e instanceof Error ? e : new Error(String(e));
				}
			},

			deleteWorkspace: async (workspaceId: string) => {
				try {
					await actions.run(
						`DeleteWorkspace(workspaceId=['${workspaceId}'])`,
					);
				} catch (e) {
					console.error(e);
				}
			},
		};
	});

	return store;
};

export type ChatStore = ReturnType<typeof createChatStore>;
