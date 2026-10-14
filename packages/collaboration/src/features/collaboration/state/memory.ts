import type {
	CollaborationState,
	Memory,
	MemoryRef,
} from "./collaboration.types";

/** BrainMemoryUtils.MAX_CHARS: one statement. */
export const MEMORY_MAX_CHARS = 500;

export function sameRef(a: MemoryRef, b: MemoryRef): boolean {
	return a.type === b.type && a.id === b.id;
}

/** Shown in lists: in use or waiting for the owner. */
export function isListed(memory: Memory): boolean {
	return memory.state === "active" || memory.state === "suggested";
}

/** Listed memories about one person, topic, account, or thread. */
export function memoriesAbout(memories: Memory[], ref: MemoryRef): Memory[] {
	return memories.filter(
		(memory) =>
			isListed(memory) &&
			memory.about.some((candidate) => sameRef(candidate, ref)),
	);
}

/** Proposed by Brain from a finished chat (or a migrated draft); not used until accepted. */
export function suggestedMemories(memories: Memory[]): Memory[] {
	return memories.filter((memory) => memory.state === "suggested");
}

/** Saved by the assistant and in use, but not confirmed by the owner. */
export function learnedMemories(memories: Memory[]): Memory[] {
	return memories.filter(
		(memory) => memory.state === "active" && !memory.confirmed,
	);
}

/** The assistant may only undo what it saved and the owner has not confirmed. */
export function canDismiss(memory: Memory): boolean {
	return (
		memory.state === "suggested" ||
		(memory.state === "active" &&
			!memory.confirmed &&
			memory.origin !== "you")
	);
}

/** A display name for what a memory is about, from the records already loaded. */
export function refLabel(state: CollaborationState, ref: MemoryRef): string {
	switch (ref.type) {
		case "person":
			return (
				state.people.find((person) => person.id === ref.id)?.name ??
				"Someone"
			);
		case "topic":
			return (
				state.topics.find((topic) => topic.id === ref.id)?.short ??
				"A topic"
			);
		case "account":
			return (
				state.accounts.find((account) => account.id === ref.id)?.name ??
				"An account"
			);
		case "thread":
			return (
				state.threads.find((thread) => thread.id === ref.id)?.subject ||
				"A thread"
			);
	}
}

/** Who wrote it, in the words the lists use. */
export function originLabel(memory: Memory): string {
	if (memory.origin === "you") return "You";
	if (memory.origin === "assistant")
		return memory.confirmed
			? "Learned in chat, confirmed"
			: "Learned in chat";
	return memory.state === "suggested"
		? "Brain suggestion"
		: "Suggested by Brain";
}

/** Mirrors BrainMergeTopics: memories about the source are about the target, one link each. */
export function moveTopicMemories(
	memories: Memory[],
	sourceId: string,
	targetId: string,
): Memory[] {
	const target: MemoryRef = { type: "topic", id: targetId };
	return memories.map((memory) => {
		if (
			!memory.about.some((ref) =>
				sameRef(ref, { type: "topic", id: sourceId }),
			)
		)
			return memory;
		const about = memory.about
			.map((ref) =>
				ref.type === "topic" && ref.id === sourceId ? target : ref,
			)
			.filter(
				(ref, index, refs) =>
					refs.findIndex((other) => sameRef(other, ref)) === index,
			);
		return { ...memory, about };
	});
}

/** Mirrors BrainDeleteTopic: memories only about the topic go with it; the rest lose the link. */
export function dropTopicMemories(
	memories: Memory[],
	topicId: string,
): Memory[] {
	const topic: MemoryRef = { type: "topic", id: topicId };
	return memories.flatMap((memory) => {
		if (!memory.about.some((ref) => sameRef(ref, topic))) return [memory];
		const about = memory.about.filter((ref) => !sameRef(ref, topic));
		return about.length ? [{ ...memory, about }] : [];
	});
}

/** "/remember <sentence>" (or "<sentence> /remember") typed in a chat: the sentence, or null for anything else. */
export function rememberCommand(text: string): string | null {
	const trimmed = text.trim();
	const match =
		/^\/remember\s+([\s\S]+)$/i.exec(trimmed) ??
		/^([\s\S]+?)\s+\/remember$/i.exec(trimmed);
	const sentence = match?.[1].replace(/\s+/g, " ").trim();
	return sentence ? sentence.slice(0, MEMORY_MAX_CHARS) : null;
}

/** A sentence telling the assistant how to act is a preference; anything else is a fact. */
export function guessMemoryKind(text: string): Memory["kind"] {
	return /^(always|never|please|don'?t|do not|prefer|i prefer|i like|i want|use|keep|sign|call me)\b/i.test(
		text.trim(),
	)
		? "preference"
		: "fact";
}
