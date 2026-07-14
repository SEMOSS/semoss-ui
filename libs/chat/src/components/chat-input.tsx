import { MicIcon, SendIcon } from "lucide-react";
import {
	type FormEvent,
	type KeyboardEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	Button,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { cn } from "../lib/utils";

export interface ChatInputProps {
	onSend: (text: string) => void;
	disabled?: boolean;
	/**
	 * True while the assistant is generating a response — swaps the Send
	 * button to a Spinner (matching playground's real room-input.tsx, whose
	 * send/pause button shows a Spinner once `isLoading` and there's no
	 * tool-execution loop to pause). Doesn't stop generation — @semoss/chat
	 * has no cancel-in-flight-stream or pause-the-agent's-tool-loop concept
	 * yet (playground's own pause button targets pausing agent-mode's
	 * automatic tool-execution loop specifically, via `toggleToolsPaused`,
	 * not stopping the LLM stream itself — a session concept this library
	 * doesn't model). See docs/chat-components/PLAN.md.
	 */
	isGenerating?: boolean;
	/**
	 * Adds a mic button that appends browser Web Speech API transcripts to
	 * the textarea — ported from room-input.tsx's real speech-to-text
	 * feature (continuous + interim results, only finalized segments get
	 * appended). Opt-in (default off) since it needs mic permission and
	 * isn't supported in every browser — silently renders nothing if
	 * `window.SpeechRecognition`/`webkitSpeechRecognition` isn't available.
	 */
	enableVoiceInput?: boolean;
	/**
	 * Controlled composer text — omit for the default uncontrolled mode
	 * (ChatInput manages its own value, clearing itself after send). Pass
	 * both `value`/`onValueChange` to lift the text out, e.g. so a
	 * `PromptOptimizer` (which needs to read/rewrite the composer's current
	 * text) can be composed alongside `trailingActions` — matches
	 * playground's own room-input.tsx, which bridges `PromptOptimizer`'s
	 * `setInput()` into its Lexical editor's content the same way.
	 */
	value?: string;
	onValueChange?: (value: string) => void;
	placeholder?: string;
	className?: string;
	/**
	 * Rendered in the bottom-right control cluster, immediately before the
	 * send button — e.g. an EngineSelect, matching playground's own
	 * bottom-right cluster (model picker, mic, sparkles, send all grouped
	 * together). Named "trailing" because it renders at the end of the
	 * control row, next to Send — not the start. Deliberately a slot rather
	 * than a baked-in engine picker: ChatInput doesn't know about
	 * engines/models at all, so any composable control can go here. See
	 * docs/chat-components/PLAN.md.
	 */
	trailingActions?: ReactNode;
}

/**
 * Composer chrome matches room-input.tsx's outer container (border-input,
 * bg-card, shadow-lg, rounded-md, focus ring) and send button
 * (@semoss/ui's Button, variant="default" size="icon-sm") — see
 * docs/chat-components/PLAN.md. Deliberately still a plain <textarea>,
 * not playground's Lexical rich-text editor (file attach, MCP menu,
 * prompt library) — that's out of scope, not something this component is
 * trying to approximate.
 */
export function ChatInput({
	onSend,
	disabled = false,
	isGenerating = false,
	enableVoiceInput = false,
	value: controlledValue,
	onValueChange,
	placeholder = "Message...",
	className,
	trailingActions,
}: ChatInputProps) {
	const isControlled = controlledValue !== undefined;
	const [internalValue, setInternalValue] = useState("");
	const value = isControlled ? controlledValue : internalValue;
	const setValue = (next: string | ((prev: string) => string)) => {
		const resolved = typeof next === "function" ? next(value) : next;
		if (isControlled) {
			onValueChange?.(resolved);
		} else {
			setInternalValue(resolved);
		}
	};
	const [canListen, setCanListen] = useState(false);
	const [isListening, setIsListening] = useState(false);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	// Mirrors value/setValue for the mic effect below, which only sets up
	// its onresult handler once (per enableVoiceInput toggle) — reading
	// through refs instead of closing over value/setValue directly avoids
	// the handler acting on a stale value across re-renders.
	const valueRef = useRef(value);
	valueRef.current = value;
	const setValueRef = useRef(setValue);
	setValueRef.current = setValue;

	useEffect(() => {
		if (!enableVoiceInput) {
			return;
		}

		const SpeechRecognitionCtor =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognitionCtor) {
			setCanListen(false);
			return;
		}
		setCanListen(true);

		const recognition = new SpeechRecognitionCtor();
		recognition.continuous = true;
		recognition.interimResults = true;
		recognition.lang = "en-US";

		recognition.onstart = () => setIsListening(true);

		recognition.onresult = (event) => {
			let transcript = "";
			for (let i = event.resultIndex; i < event.results.length; i++) {
				if (event.results[i].isFinal) {
					transcript += event.results[i][0].transcript;
				}
			}
			transcript = transcript.trim();
			if (transcript) {
				const prev = valueRef.current;
				setValueRef.current(
					prev ? `${prev} ${transcript}` : transcript,
				);
			}
		};

		recognition.onerror = () => {
			setIsListening(false);
			textareaRef.current?.focus();
		};

		recognition.onend = () => {
			setIsListening(false);
			textareaRef.current?.focus();
		};

		recognitionRef.current = recognition;

		return () => {
			recognitionRef.current?.stop();
			recognitionRef.current = null;
		};
	}, [enableVoiceInput]);

	function submit() {
		const trimmed = value.trim();
		if (!trimmed || disabled) {
			return;
		}
		onSend(trimmed);
		setValue("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		submit();
	}

	function toggleListening() {
		if (isListening) {
			recognitionRef.current?.stop();
			textareaRef.current?.focus();
		} else {
			recognitionRef.current?.start();
		}
	}

	return (
		<form
			data-slot="chat-input"
			onSubmit={handleSubmit}
			className={cn(
				"flex flex-col overflow-hidden rounded-md border border-input bg-card shadow-lg transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
				className,
			)}
		>
			<textarea
				ref={textareaRef}
				data-slot="chat-input-textarea"
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				placeholder={placeholder}
				rows={1}
				className="max-h-40 resize-none bg-transparent px-4 pt-4 pb-4 text-foreground text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
			/>
			<div className="flex items-center justify-end gap-2 bg-card p-2">
				{enableVoiceInput && canListen && (
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								data-slot="chat-input-mic"
								type="button"
								variant="ghost"
								size="icon-sm"
								disabled={disabled}
								aria-label={
									isListening ? "Stop recording" : "Record"
								}
								onClick={toggleListening}
							>
								<MicIcon
									className={cn(
										isListening &&
											"animate-pulse text-destructive",
									)}
								/>
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							{isListening ? "Stop recording" : "Record"}
						</TooltipContent>
					</Tooltip>
				)}
				{trailingActions}
				<Button
					data-slot="chat-input-send"
					type="submit"
					variant="default"
					size="icon-sm"
					aria-label={isGenerating ? "Generating response" : "Send"}
					disabled={disabled || !value.trim()}
				>
					{isGenerating ? <Spinner /> : <SendIcon />}
				</Button>
			</div>
		</form>
	);
}
