import { Copy, X } from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Prompt } from "@/types/prompt";

interface PromptDetailsModalProps {
	open: boolean;
	onClose: () => void;
	prompt: Prompt | null;
	onUse: (promptText: string) => void; // kept for compatibility (not used here)
	onCopy: (text: string) => void;
}

function useMediaQuery(query: string) {
	const [matches, setMatches] = useState<boolean>(() => {
		if (typeof window === "undefined" || !window.matchMedia) return false;
		return window.matchMedia(query).matches;
	});

	useEffect(() => {
		if (typeof window === "undefined" || !window.matchMedia) return;

		const mql = window.matchMedia(query);
		const onChange = (e: MediaQueryListEvent) => setMatches(e.matches);

		setMatches(mql.matches);

		if (mql.addEventListener) {
			mql.addEventListener("change", onChange);
			return () => mql.removeEventListener("change", onChange);
		}

		// eslint-disable-next-line deprecation/deprecation
		mql.addListener(onChange);
		// eslint-disable-next-line deprecation/deprecation
		return () => mql.removeListener(onChange);
	}, [query]);

	return matches;
}

function formatDate(dateLike: Date | string | number | null | undefined) {
	if (!dateLike) return "";

	const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
	if (Number.isNaN(d.getTime())) return String(dateLike);

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(d);
}

export const PromptDetailsModal: React.FC<PromptDetailsModalProps> = ({
	open,
	onClose,
	prompt,
	onCopy,
}) => {
	const isMobile = useMediaQuery("(max-width: 640px)");
	const dialogTitleId = useId();

	const createdValue = prompt?.dateCreated ?? null;

	const createdText = useMemo(() => formatDate(createdValue), [createdValue]);

	const promptText = useMemo(() => {
		const raw = prompt?.intent ?? prompt?.context ?? "";
		return String(raw);
	}, [prompt?.intent, prompt?.context]);

	const tags = useMemo(() => {
		const raw = prompt?.tags;
		if (!Array.isArray(raw)) return [];
		return Array.from(new Set(raw.map((t) => String(t)))).filter(Boolean);
	}, [prompt?.tags]);

	useEffect(() => {
		if (!open) return;

		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, onClose]);

	if (!open || !prompt) return null;

	const title = String(prompt.title ?? "");
	const createdBy =
		typeof prompt.createdBy === "string" ? prompt.createdBy : "";
	const version = typeof prompt.version === "number" ? prompt.version : null;
	const scope =
		typeof prompt.global === "boolean"
			? prompt.global
				? "Global"
				: "My Prompts"
			: "";

	const handleCopy = () => {
		onCopy(promptText);
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-labelledby={dialogTitleId}
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) onClose();
			}}
		>
			<div
				className={[
					"w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg",
					isMobile
						? "h-[100vh] max-h-[100vh] rounded-none"
						: "max-w-3xl",
				].join(" ")}
			>
				<div className="flex items-center justify-between border-slate-200 border-b px-4 py-3">
					<div
						id={dialogTitleId}
						className="font-semibold text-[20px] text-slate-900"
					>
						{title}
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="rounded-md p-2 text-slate-500 hover:bg-slate-100"
					>
						<X className="h-5 w-5" />
					</button>
				</div>

				<div className="p-4">
					<div className="flex flex-col gap-6">
						<div>
							<div className="mb-3 font-semibold text-slate-900 text-sm">
								Details
							</div>

							<div className="flex flex-wrap items-center gap-x-10 gap-y-2">
								{createdValue ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											Created:
										</div>
										<div className="text-slate-900 text-sm">
											{createdText}
										</div>
									</div>
								) : null}

								{createdBy ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											Created by:
										</div>
										<div className="text-slate-900 text-sm">
											{createdBy}
										</div>
									</div>
								) : null}

								{version !== null ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											Version:
										</div>
										<div className="text-slate-900 text-sm">
											{version}
										</div>
									</div>
								) : null}

								{scope ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											Scope:
										</div>
										<div className="text-slate-900 text-sm">
											{scope}
										</div>
									</div>
								) : null}
							</div>
						</div>

						<div className="h-px bg-slate-200" />

						{prompt.context ? (
							<div>
								<div className="mb-2 font-semibold text-slate-900 text-sm">
									context
								</div>
								<div className="max-h-[250px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
									<div className="whitespace-pre-wrap text-slate-600 text-sm leading-6">
										{String(prompt.context)}
									</div>
								</div>
							</div>
						) : null}

						<div>
							<div className="mb-2 flex items-center justify-between">
								<div className="font-semibold text-slate-900 text-sm">
									Prompt Text
								</div>
								<button
									type="button"
									onClick={handleCopy}
									aria-label="Copy prompt text"
									className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
								>
									<Copy className="h-4 w-4" />
								</button>
							</div>

							<div className="max-h-[200px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
								<div className="whitespace-pre-wrap text-slate-900 text-sm leading-6">
									{promptText}
								</div>
							</div>
						</div>

						<div className="h-px bg-slate-200" />

						{tags.length > 0 ? (
							<div>
								<div className="mb-2 font-semibold text-slate-900 text-sm">
									Tags
								</div>
								<div className="flex flex-wrap gap-2">
									{tags.map((tag) => (
										<span
											key={`${String(prompt.id ?? "prompt")}:${tag}`}
											className="inline-flex items-center rounded-md bg-sky-100 px-2 py-1 font-medium text-sky-700 text-xs"
										>
											{tag}
										</span>
									))}
								</div>
							</div>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
};
