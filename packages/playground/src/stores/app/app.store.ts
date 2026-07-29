import { makeAutoObservable, runInAction } from "mobx";
import type { Insight } from "@semoss/sdk/react";
import type { ThemeMap } from "@semoss/shared";
import type { Engine, MCPConfig, Workspace } from "@/types";

const DEFAUlT_MODEL_ID = import.meta.env.VITE_DEFAUlT_MODEL_ID || "";
const DEFAUlT_MODEL_NAME = import.meta.env.VITE_DEFAUlT_MODEL_NAME || "";

const SESSION_MODEL_KEY = "smss-playground-session-model";

interface AppStoreState {
	isInitialized: boolean;

	models: {
		selected: Engine;
		contextWindow?: number;
	};

	profileDefaultModelId: string;

	embeddedPageMap: Record<
		string,
		| ThemeMap["playground"]["sidebar"]["headerItems"][number]
		| ThemeMap["playground"]["sidebar"]["footerItems"][number]
	>;

	user: {
		id: string;
		name: string;
		lastLogin?: string;
	};
}

export class AppStore {
	private _theme: ThemeMap["playground"];
	private _actions: Insight["actions"];
	private _state: AppStoreState = {
		isInitialized: false,
		models: {
			selected: null as unknown as Engine,
			contextWindow: undefined,
		},
		embeddedPageMap: {},
		profileDefaultModelId: "",
		user: {
			id: "",
			name: "",
		},
	};

	constructor(theme: ThemeMap["playground"], actions: Insight["actions"]) {
		this._theme = theme;
		this._actions = actions;
		this._state.embeddedPageMap = [
			...theme.sidebar.headerItems,
			...theme.sidebar.footerItems,
		]
			.filter((item) => item.embed && item.url)
			.reduce(
				(acc, item) => {
					acc[item.path] = item;
					return acc;
				},
				{} as AppStoreState["embeddedPageMap"],
			);

		makeAutoObservable(this);
	}

	get isInitialized() {
		return this._state.isInitialized;
	}

	get models() {
		return this._state.models;
	}

	get user() {
		return this._state.user;
	}

	get embeddedPageMap() {
		return this._state.embeddedPageMap;
	}

	get profileDefaultModelId() {
		return this._state.profileDefaultModelId;
	}

	initialize = async (): Promise<void> => {
		try {
			await this.getUser();
			await this.getDefaultModel();
		} catch (e) {
			console.error(e);
		} finally {
			runInAction(() => {
				this._state.isInitialized = true;
			});
		}
	};

	setSelectedModel = (model: Engine): void => {
		runInAction(() => {
			this._state.models.selected = model;
		});

		sessionStorage.setItem(
			SESSION_MODEL_KEY,
			JSON.stringify({ model, lastLogin: this._state.user.lastLogin }),
		);

		this.loadEngineContextWindow(model.engine_id);
	};

	addWorkspace = async (
		data: Pick<
			Workspace,
			| "name"
			| "system_prompt"
			| "description"
			| "mcp"
			| "skills"
			| "prompts"
		>,
	): Promise<string> => {
		const mcp = data.mcp.map(
			({ name, id, type }): MCPConfig => ({ name, id, type }),
		);
		const skills = data.skills.map((s) => s.id);

		const pixel = `AddWorkspace(name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
		const { pixelReturn } = await this._actions.run<[string]>(pixel);

		return pixelReturn[0].output;
	};

	editWorkspace = async (
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
	): Promise<string> => {
		const mcp = data.mcp.map(
			({ name, id, type }): MCPConfig => ({ name, id, type }),
		);
		const skills = data.skills.map((s) => s.id);

		const pixel = `EditWorkspace(workspaceId=${JSON.stringify(workspaceId)}, name=${JSON.stringify(data.name)}, description="<encode>${data.description}</encode>", systemPrompt="<encode>${data.system_prompt}</encode>", mcp=${JSON.stringify(mcp)}, skills=${JSON.stringify(skills)}, prompts=${JSON.stringify(data.prompts)})`;
		const { pixelReturn } = await this._actions.run<[string]>(pixel);

		if (!pixelReturn[0].output) {
			throw new Error("Failed to edit workspace");
		}

		return workspaceId;
	};

	deleteWorkspace = async (workspaceId: string): Promise<void> => {
		await this._actions.run(
			`DeleteWorkspace(workspaceId=['${workspaceId}'])`,
		);
	};

	private getUser = async (): Promise<void> => {
		const result = await this._actions.run<
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

		const providerData = Object.values(result.pixelReturn[0].output)[0];
		if (!providerData) return;

		runInAction(() => {
			this._state.user = {
				id: providerData.id,
				name: providerData.name,
				lastLogin: providerData.lastLogin,
			};
		});

		const metaValue = providerData.meta?.["text-generation-model"];
		const profileDefaultModelId = Array.isArray(metaValue)
			? (metaValue[0] as string) || ""
			: typeof metaValue === "string"
				? metaValue
				: "";

		runInAction(() => {
			this._state.profileDefaultModelId = profileDefaultModelId;
		});
	};

	private loadEngineContextWindow = async (engineId: string) => {
		runInAction(() => {
			this._state.models.contextWindow = undefined;
		});

		const { pixelReturn } = await this._actions.run<[number | undefined]>(
			`META | GetContextWindow(${JSON.stringify(engineId)});`,
		);

		if (this.models.selected?.engine_id === engineId) {
			runInAction(() => {
				this._state.models.contextWindow = pixelReturn[0].output;
			});
		}
	};

	private getDefaultModel = async (): Promise<void> => {
		const defaultModelId =
			this._theme.defaultRoomSettings?.model?.engine_id ||
			DEFAUlT_MODEL_ID;
		const defaultModelName =
			this._theme.defaultRoomSettings?.model?.engine_display_name ||
			this._theme.defaultRoomSettings?.model?.engine_name ||
			DEFAUlT_MODEL_NAME;

		if (!this._theme.featureFlags?.enableModelSelect) {
			this.setSelectedModel({
				engine_id: defaultModelId,
				engine_name: defaultModelName,
				engine_type: "MODEL",
			});
			return;
		}

		const { pixelReturn } = await this._actions.run<[Engine[]]>(
			`META | MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
		);

		runInAction(() => {
			const { output } = pixelReturn[0];
			const profileDefaultModelId = this._state.profileDefaultModelId;
			let isSelected = false;

			if (profileDefaultModelId) {
				for (const m of output) {
					if (m.engine_id === profileDefaultModelId) {
						this.setSelectedModel(m);
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
						const currentLogin = this._state.user.lastLogin;
						if (
							storedLogin &&
							currentLogin &&
							storedLogin === currentLogin
						) {
							for (const m of output) {
								if (m.engine_id === sessionModel.engine_id) {
									this.setSelectedModel(m);
									isSelected = true;
									break;
								}
							}
						}
					}
				} catch {
					// ignore parse errors
				}
			}

			if (!isSelected && defaultModelId) {
				for (const m of output) {
					if (m.engine_id === defaultModelId) {
						this.setSelectedModel(m);
						isSelected = true;
						break;
					}
				}
			}

			if (!isSelected && output.length > 0) {
				this.setSelectedModel(output[0]);
			}
		});
	};
}
