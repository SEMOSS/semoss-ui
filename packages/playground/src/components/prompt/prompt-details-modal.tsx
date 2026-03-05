import { Copy } from "lucide-react";
import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import type { Prompt } from "@/types/prompt";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@semoss/ui/next";
import { useTranslation } from "@semoss/i18n";
import { formatDate } from "@/utility/utils"

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



export const PromptDetailsModal: React.FC<PromptDetailsModalProps> = ({
	open,
	onClose,
	prompt,
	onCopy,
}) => {
	const { t } = useTranslation(["prompt-library", "common"]);
	const isMobile = useMediaQuery("(max-width: 640px)");
	const dialogTitleId = useId();

	const createdValue = prompt?.dateCreated ?? null;

	const createdText = useMemo(() => formatDate(createdValue), [createdValue]);

	const promptText = useMemo(() => {
		const raw = prompt?.context ?? "";
		return String(raw);
	}, [prompt?.context]);

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
		<Dialog
			open={open}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
			aria-labelledby={dialogTitleId}
		>
			<DialogContent
				className={[
					"w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg",
					isMobile
						? "h-[100vh] max-h-[100vh] rounded-none"
						: "max-w-3xl",
				].join(" ")}
			>
				<DialogHeader className="flex items-center justify-between border-slate-200 border-b px-4 py-3">
					<DialogTitle
						id={dialogTitleId}
						className="font-semibold text-[20px] text-slate-900"
					>
						{title}
					</DialogTitle>
				</DialogHeader>

				<div className="p-4">
					<div className="flex flex-col gap-6">
						<div>
							<div className="mb-3 font-semibold text-slate-900 text-sm">
								{t("promptLibrary:details.title")}
							</div>

							<div className="flex flex-wrap items-center gap-x-10 gap-y-2">
								{createdValue ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											{t("promptLibrary:details.created")}
										</div>
										<div className="text-slate-900 text-sm">
											{createdText}
										</div>
									</div>
								) : null}

								{createdBy ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											{t("promptLibrary:details.createdBy")}
										</div>
										<div className="text-slate-900 text-sm">
											{createdBy}
										</div>
									</div>
								) : null}

								{version !== null ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											{t("promptLibrary:details.version")}
										</div>
										<div className="text-slate-900 text-sm">
											{version}
										</div>
									</div>
								) : null}

								{scope ? (
									<div className="flex items-center gap-2">
										<div className="font-medium text-slate-500 text-sm">
											{t("promptLibrary:details.scope")}
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
								<div className="mb-2 flex items-center justify-between">
									<div className="font-semibold text-slate-900 text-sm">
										{t("promptLibrary:details.description")}
									</div>
									<button
										type="button"
										onClick={handleCopy}
										aria-label="Copy context"
										className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
									>
										<Copy className="h-4 w-4" />
									</button>
								</div>
								<div className="max-h-[250px] overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3">
									<div className="whitespace-pre-wrap text-slate-600 text-sm leading-6">
										{String(prompt.context)}
									</div>
								</div>
							</div>
						) : null}


						{tags.length > 0 ? (
						<>
							<div className="h-px bg-slate-200" />
								<div>
									<div className="mb-2 font-semibold text-slate-900 text-sm">
										{t("promptLibrary:details.tags")}
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
						</>
						) : null}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};
