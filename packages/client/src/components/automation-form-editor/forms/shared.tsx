import { Check, Copy } from "lucide-react";
import { useRef, useState } from "react";
import {
	Field,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
} from "@semoss/ui/next";
import type { EngineOption } from "@/pages/automation/automation.types";

export function BoundInput({
	label,
	value,
	placeholder,
	onChange,
	upstreamVars,
	mono,
}: {
	label: string;
	value: string;
	placeholder?: string;
	onChange: (v: string) => void;
	upstreamVars: string[];
	mono?: boolean;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [partialStart, setPartialStart] = useState(-1);

	const detect = (val: string, cursor: number) => {
		if (!upstreamVars.length) return;
		const before = val.slice(0, cursor);
		const lastOpen = before.lastIndexOf("${");
		if (lastOpen === -1 || before.slice(lastOpen + 2).includes("}")) {
			setSuggestions([]);
			return;
		}
		const filter = before.slice(lastOpen + 2).toLowerCase();
		setPartialStart(lastOpen);
		setSuggestions(
			upstreamVars.filter((v) => v.toLowerCase().includes(filter)),
		);
	};

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		onChange(e.target.value);
		detect(
			e.target.value,
			e.target.selectionStart ?? e.target.value.length,
		);
	};

	const handleKeyUp = (
		e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		if (e.key === "Escape") {
			setSuggestions([]);
			return;
		}
		const el = e.currentTarget;
		detect(el.value, el.selectionStart ?? el.value.length);
	};

	const handleBlur = () => {
		closeTimer.current = setTimeout(() => setSuggestions([]), 150);
	};

	const handleFocus = () => {
		if (closeTimer.current) clearTimeout(closeTimer.current);
	};

	const insertVar = (v: string) => {
		const el = (mono ? textareaRef.current : inputRef.current) as
			| HTMLInputElement
			| HTMLTextAreaElement
			| null;
		if (!el || partialStart === -1) return;
		const cursor = el.selectionStart ?? value.length;
		const inserted = `\${${v}}`;
		const newVal =
			value.slice(0, partialStart) + inserted + value.slice(cursor);
		onChange(newVal);
		setSuggestions([]);
		const newCursor = partialStart + inserted.length;
		requestAnimationFrame(() => {
			el.focus();
			el.setSelectionRange(newCursor, newCursor);
		});
	};

	const sharedProps = {
		value,
		onChange: handleChange,
		onKeyUp: handleKeyUp,
		onBlur: handleBlur,
		onFocus: handleFocus,
		placeholder,
	};

	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="relative">
				{mono ? (
					<Textarea
						ref={textareaRef}
						{...sharedProps}
						className="font-mono text-xs"
						rows={4}
					/>
				) : (
					<Input ref={inputRef} {...sharedProps} />
				)}
				{suggestions.length > 0 && (
					<div className="absolute top-full right-0 left-0 z-50 mt-0.5 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
						{suggestions.map((v) => (
							<button
								key={v}
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									insertVar(v);
								}}
								className="flex w-full items-center gap-2 px-3 py-1.5 text-left font-mono text-xs hover:bg-accent hover:text-accent-foreground"
							>
								<span className="text-[10px] text-muted-foreground">
									{/* biome-ignore lint/suspicious/noTemplateCurlyInString: intentional display of ${} syntax */}
									{"${}"}
								</span>
								{v}
							</button>
						))}
					</div>
				)}
			</div>
		</Field>
	);
}

export function EngineSelect({
	label,
	value,
	engines,
	onChange,
	triggerClassName = "h-8 text-xs",
	labelClassName = "text-xs",
}: {
	label: string;
	value: string;
	engines: EngineOption[];
	onChange: (v: string) => void;
	triggerClassName?: string;
	labelClassName?: string;
}) {
	return (
		<Field>
			<FieldLabel className={labelClassName}>{label}</FieldLabel>
			<Select value={value} onValueChange={onChange}>
				<SelectTrigger className={triggerClassName}>
					<SelectValue
						placeholder={
							engines.length
								? `Select ${label.toLowerCase()}…`
								: "No engines available"
						}
					/>
				</SelectTrigger>
				<SelectContent>
					{engines.map((e) => (
						<SelectItem
							key={e.engine_id}
							value={e.engine_id}
							className="py-1.5 text-xs"
						>
							<span className="flex flex-col gap-0.5">
								<span>
									{e.engine_display_name ?? e.engine_name}
								</span>
								<span className="font-mono text-[10px] text-muted-foreground">
									{e.engine_id}
								</span>
							</span>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</Field>
	);
}

export function CopyButton({
	value,
	label,
}: {
	value: string;
	label?: string;
}) {
	const [copied, setCopied] = useState(false);
	return (
		<button
			type="button"
			onClick={() => {
				navigator.clipboard.writeText(value);
				setCopied(true);
				setTimeout(() => setCopied(false), 1500);
			}}
			className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
		>
			{copied ? (
				<Check className="h-3 w-3 text-emerald-500" />
			) : (
				<Copy className="h-3 w-3" />
			)}
			{label ?? "Copy"}
		</button>
	);
}
