import type { ChatMessage, MCPConfig, RoomSummary } from "@semoss/chat";

/**
 * Shared sample data for every doc page's live previews. Reuses the same
 * fixtures libs/chat/sandbox/App.tsx already proves out, so this reference
 * site stays consistent with the library's own internal sandbox rather than
 * inventing a second set of demo content.
 */

export const SAMPLE_MESSAGES: ChatMessage[] = [
	{
		id: "1",
		role: "user",
		parts: [
			{
				type: "text",
				id: "p1",
				text: "What's the status of claim #482?",
			},
		],
		status: "complete",
		timestamp: new Date(),
	},
	{
		id: "2",
		role: "assistant",
		parts: [
			{
				type: "text",
				id: "p2",
				text: "Claim **#482** is currently in review. Estimated completion: 3 business days.",
			},
		],
		status: "complete",
		timestamp: new Date(),
	},
	{
		id: "3",
		role: "assistant",
		parts: [
			{
				type: "text",
				id: "p3",
				text: "Something went wrong reaching the model.",
			},
		],
		status: "error",
		timestamp: new Date(),
	},
];

export const TOOL_CALL_MESSAGE: ChatMessage = {
	id: "4",
	role: "assistant",
	parts: [
		{
			type: "tool_call",
			id: "tool-1",
			name: "lookupClaimStatus",
			arguments: { claimId: "482" },
		},
	],
	status: "streaming",
	timestamp: new Date(),
};

export const FEEDBACK_DEMO_MESSAGE: ChatMessage = {
	id: "8",
	role: "assistant",
	parts: [
		{
			type: "text",
			id: "p8",
			text: "Claim **#482** is currently in review. Estimated completion: 3 business days.",
		},
	],
	status: "complete",
	timestamp: new Date(),
};

export const SAMPLE_MCP: MCPConfig[] = [
	{ type: "VECTOR", id: "kb-1", name: "Claims Knowledge Base" },
	{ type: "FUNCTION", id: "tool-1", name: "LighthouseBenefitsClaims" },
];

export const SAMPLE_ROOMS: RoomSummary[] = [
	{
		roomId: "r1",
		name: "Say goodbye in exactly two words.",
		dateCreated: new Date(),
		pinned: true,
	},
	{
		roomId: "r2",
		name: "Travel ideas for India",
		dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 6),
		pinned: false,
	},
	{
		roomId: "r3",
		name: "based on my service history what benefits should i apply for",
		dateCreated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
		pinned: false,
	},
];
