export interface Engine {
	engine_id: string;
	engine_name: string;
	engine_display_name?: string;
	engine_type: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
	engine_subtype?: string;
	engine_favorite?: number;
	engine_global?: boolean;
	engine_discoverable?: boolean;
	engine_user_permission?: number;
	engine_group_permission?: number;
	engine_date_created?: string;
	engine_cost?: string;
	low_engine_name?: string;
	description?: string;

	/** @deprecated legacy keys from MyEngines */
	app_id?: string;
	/** @deprecated legacy keys from MyEngines */
	app_name?: string;
	/** @deprecated legacy keys from MyEngines */
	app_type?: "MODEL" | "STORAGE" | "DATABASE" | "FUNCTION" | "VECTOR";
}

export interface App {
	project_id: string;
	project_name: string;
	description?: string;
}

/**
 * Theme object returned from the backend
 */
export interface ThemeMap {
	playground: {
		/** Name of the app */
		name: string;

		banner: string;

		/** Description of the app */
		description: string;

		/**
		 * Optional disclaimer shown in the file drag overlay.
		 * When omitted, the description is hidden entirely.
		 */
		fileDragDisclaimer?: string;

		/** Styles of the app */
		variables: {
			backgroundColor: string;
			primaryColor: string;
			secondaryColor: string;
		};

		/** Images throughout app */
		images: {
			app: string;
			logo: string;
			login: string;
			landing: string;
			tabIcon: string;
			workspace: string;
			loginDark: string;
			landingDark: string;
			workspaceDark: string;
			error: string;
			errorDark: string;
		};

		/**
		 * Custom CSS to override default styles
		 */
		overrides: {
			"main-layout": React.CSSProperties;
		};

		/**
		 * HTML content tos how in the footer
		 */
		footer: string;

		/**
		 * HTML Content to show on the landing page
		 */
		landing: string;

		/**
		 * Alternate HTML content to show on the landing page
		 */
		altLanding?: string;

		/**
		 * URL search param key that triggers altLanding (e.g. "appt" matches ?appt in the URL)
		 */
		altLandingKey?: string;

		/**
		 * Content to show in the sidebar
		 */
		sidebar: {
			expandedByDefault: boolean;
			chatHistoryDate: boolean;
			headerItems: {
				name: string;
				icon: string;
				path: string;
				url: string;
				embed: boolean;
			}[];
			footerItems: {
				name: string;
				icon: string;
				path: string;
				url: string;
				embed: boolean;
			}[];
		};

		/**
		 * Content to show in the dialog
		 */
		dialog?: {
			key: string;
			title: string;
			content: string;
		};

		/**
		 * The default settings for new rooms
		 */
		defaultRoomSettings?: {
			model?: Engine;
			temperature?: number;
			tokenLength?: number;
			/**
			 * Auto-compaction thresholds. When any (or all, if mode="all") threshold is
			 * reached, the UI surfaces a warning or blocking prompt to compact.
			 */
			autoCompaction?: {
				/**
				 * Master on/off switch. Set to false to disable auto-compaction
				 * entirely (banners, countdown, auto-trigger). Manual compaction
				 * from the settings menu is unaffected. Defaults to true when the
				 * config block is present.
				 */
				enabled?: boolean;

				/**
				 * Which compaction method(s) to request from the backend.
				 * - "auto"        — backend auto-detects: TOOL_PRUNE if tool tokens
				 *                   exceed 25% of context, otherwise SUMMARY (default)
				 * - "TOOL_PRUNE"  — strip tool call/result cycles only (cheap, lossless)
				 * - "SUMMARY"     — LLM-generated summary of older messages (lossy)
				 * - ["TOOL_PRUNE", "SUMMARY"] — run both in order
				 */
				compactionMethod?:
					| "auto"
					| "TOOL_PRUNE"
					| "SUMMARY"
					| ("TOOL_PRUNE" | "SUMMARY")[];

				/** Trigger at this fraction of the context window, e.g. 0.8 = 80% */
				contextWindowPercent?: number;
				/** Trigger after N turns since the last compaction (or room start) */
				messagesSinceCompaction?: number;
				/** Trigger after N total input tokens billed since the last compaction */
				accumulatedInputTokensSinceCompaction?: number;
				/**
				 * Absolute token floor. When tokensUsed is at or below this value,
				 * no compaction triggers fire regardless of message count or other
				 * thresholds. Useful for ensuring light conversations are never
				 * interrupted. e.g. 50000 = always chat freely below 50k tokens.
				 *
				 * Works across model sizes:
				 *   50k on 200k Haiku  = 25% CW
				 *   50k on 1M GPT-4    =  5% CW
				 */
				tokenFloor?: number;

				/**
				 * Sliding-scale message threshold driven by context window fill %.
				 * Each tier defines the message limit to apply when context usage
				 * is >= contextPercent. Tiers are evaluated highest-first; the first
				 * matching tier wins. Tiers below the lowest contextPercent are never
				 * reached — omit a 0% entry to disable message-count triggering when
				 * the context window is minimally used.
				 *
				 * Works best when combined with tokenFloor so very short conversations
				 * never trigger compaction even if they hit a low-% tier.
				 *
				 * Values are piecewise-linearly interpolated between the anchors.
				 * With two anchors this is a straight line; more anchors = piecewise segments.
				 * Below the lowest anchor: no message-count trigger (floor handles that range).
				 * Above the highest anchor: clamped to the last anchor's message count.
				 *
				 * Example (works across 200k–1M context models):
				 *   tokenFloor: 50000,
				 *   messageThresholdByContextUsage: [
				 *     { contextPercent: 0.05, messages: 25 },  // 5% CW  → 25 msgs
				 *     { contextPercent: 0.75, messages: 5  },  // 75% CW → 5 msgs
				 *     // in between: linearly interpolated, e.g. 40% CW → ~15 msgs
				 *   ]
				 *
				 * Requires chat.models.contextWindow to be available (model must be selected).
				 * Falls back gracefully — no ratio is added when contextWindow is unknown.
				 */
				messageThresholdByContextUsage?: Array<{
					contextPercent: number;
					messages: number;
				}>;
				/**
				 * Weight applied to each completed tool execution when computing
				 * effective message count. e.g. 0.25 means 4 tool cycles = 1
				 * message equivalent. Defaults to 0 (tool cycles not counted).
				 * Compaction never fires unless at least one real user message
				 * has been sent since the last compaction.
				 */
				toolCycleWeight?: number;
				/** "any" fires when any threshold is hit (default); "all" requires all */
				mode?: "any" | "all";
				/**
				 * For percentage-based thresholds (contextWindowPercent,
				 * accumulatedInputTokensSinceCompaction), show a warning at this
				 * fraction of the threshold, e.g. 0.75 = warn at 75% of the way there.
				 */
				warningThreshold?: number;
				/**
				 * For message-count thresholds (messagesSinceCompaction,
				 * messageThresholdByContextUsage), warn this many messages before
				 * the limit. A flat buffer gives consistent runway across all tiers —
				 * e.g. 3 warns at 2 msgs on a 5-limit and at 22 msgs on a 25-limit.
				 * Defaults to 3.
				 */
				warningMessageBuffer?: number;
			};
		};

		/**
		 * The number of tools that should be auto-executed at once
		 */
		toolAutoExecutionLimit?: number | null;

		/**
		 * The uploaded files that should be added to the file tool in the room
		 */
		allowedFileTypes?: string[];

		/**
		 * Additional URL prefixes (e.g. custom protocols) allowed in markdown link rendering.
		 * Defaults to ["docubridge://"].
		 */
		allowedUrlPrefixes?: string[];

		/**
		 * Default embedding engine UUID to use when allowEmbeddingOptions is false.
		 */
		defaultEmbedderId?: string;

		/**
		 * Default tools to show in the room
		 */
		defaultTools: {
			/** Type of the mcp */
			type:
				| "PROJECT"
				| "STORAGE"
				| "DATABASE"
				| "FUNCTION"
				| "MODEL"
				| "VECTOR";

			/** Id of the mcp */
			id: string;

			/** Name of the mcp */
			name: string;
		}[];

		/**
		 * Optional tour customization. When present, custom steps are appended
		 * to the built-in tour steps. Each step targets a sidebar headerItem by
		 * its `path` value — the nav element must be visible for the spotlight to
		 * work. Steps are omitted entirely when this field is absent.
		 */
		tour?: {
			/**
			 * Master switch for the tour. Set to false to disable the tour
			 * entirely — it will never auto-launch and cannot be triggered
			 * manually. Defaults to true when omitted.
			 */
			show?: boolean;
			/**
			 * Built-in step targets to remove from the tour.
			 * Use the `target` string of the step you want to hide:
			 *   "welcome"          — the opening welcome card (no spotlight)
			 *   "tour-input"       — the chat input step
			 *   "tour-input-menu"  — the attach & configure step
			 *   "tour-new-chat"    — the new chat sidebar button
			 *   "tour-agents"      — the agents sidebar button
			 * Steps not listed here are shown as normal.
			 */
			excludedSteps?: string[];
			customSteps?: {
				/**
				 * Must match the `path` of a sidebar.headerItems entry.
				 * The nav element is targeted via data-tour="nav-{navItemPath}".
				 */
				navItemPath: string;
				/** Heading shown in the tour card */
				title: string;
				/** Body text shown in the tour card */
				content: string;
				/** Card placement relative to the highlighted element */
				placement?: "top" | "bottom" | "left" | "right";
			}[];
			/**
			 * Same shape as customSteps but inserted AFTER the Search
			 * step instead of after New Chat. Use this for footer-area items
			 * (e.g. Support, Bug Report).
			 */
			trailingCustomSteps?: {
				navItemPath: string;
				title: string;
				content: string;
				placement?: "top" | "bottom" | "left" | "right";
			}[];
			/**
			 * Override the title and/or content of any built-in step.
			 * Keys are the step's `target` string (or "welcome" for the
			 * opening card). Only the fields you provide are replaced.
			 *
			 * Example:
			 *   "stepOverrides": {
			 *     "welcome":        { "title": "Hi there!", "content": "..." },
			 *     "tour-new-chat":  { "content": "Start a fresh conversation." }
			 *   }
			 */
			stepOverrides?: Record<
				string,
				{ title?: string; content?: string }
			>;
		};

		/**
		 * Graceful error messages to show in the UI
		 */
		gracefulErrors: (
			| {
					pattern: string;
					errorKey: string;
			  }
			| {
					pattern: string;
					text: string;
			  }
		)[];

		/**
		 * Feature flags to enable/disable features in the UI. The keys are the names of the features, and the values are booleans indicating whether the feature is enabled or disabled.
		 */
		featureFlags?: {
			enableModelSelect?: boolean;
			enableAgent?: boolean;
			enableSuggestions?: boolean;
			enablePlan?: boolean;
			enableRewrite?: boolean;
			enableDarkMode?: boolean;
			enablePromptOptimizer?: boolean;
			/** Whether to hide tools when the app is rendered inside an iframe. */
			hideToolsInIframe?: boolean;
			/** Whether to run MakeEngineMCP after creating a new knowledge source. Defaults to true. */
			enableKnowledgeMCP?: boolean;
			/** Whether to show the embedding model selector in the new knowledge form. Defaults to true. */
			allowEmbeddingOptions?: boolean;
			/** Whether to show the Knowledge library picker in the chat input menu. Defaults to true. */
			showKnowledgeMenu?: boolean;
			/** Whether to show the Toolbox picker in the chat input menu. Defaults to true. */
			showToolboxMenu?: boolean;
			/** Whether to show external links to the SEMOSS platform. Defaults to true. */
			showPlatformLinks?: boolean;
			/** Whether to show a text input for feedback comments when rating a response. Defaults to false. */
			enableFeedbackText?: boolean;
		};
	};
}

export type Role = "OWNER" | "EDIT" | "READ_ONLY";

/**
 * User permission entry for adding/editing permissions
 */
export interface PostUser {
	userid: string;
	permission: Role;
}

/**
 * User details with permission information
 */
export interface User {
	date_added?: string;
	name: string;
	permission: Role;
	id: string;
	type?: string;
	email?: string;
}

/**
 * User access request for approval
 */
export interface UserAccessRequest {
	id: string;
	permission: Role;
}
