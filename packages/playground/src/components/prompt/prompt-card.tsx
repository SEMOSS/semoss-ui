import { ArrowRight, Copy, Pencil, Trash2, X } from "lucide-react";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	Button,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Prompt } from "@/types/prompt";

interface PromptCardProps {
	prompt: Prompt;
	onEdit: () => void;
	onDelete: () => void;
	category: string;
	onShowDetails?: (prompt: Prompt) => void;
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

function formatCreatedAt(createdAt: Date | string | number | null | undefined) {
	if (!createdAt) return "";

	const d = createdAt instanceof Date ? createdAt : new Date(createdAt);
	if (Number.isNaN(d.getTime())) return "";

	return new Intl.DateTimeFormat("en-US", {
		month: "2-digit",
		day: "2-digit",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(d);
}

function getDescription(prompt: Prompt): string {
	// context is the prompt itself ("description")
	return String(prompt.context ?? "").trim();
}

export function PromptCard({
	prompt,
	onEdit,
	onDelete,
	category,
	onShowDetails,
}: PromptCardProps) {
	const { id, title, dateCreated } = prompt;

	const description = getDescription(prompt);

	const tags = useMemo(() => {
		const raw = prompt.tags;
		if (!Array.isArray(raw)) return [] as string[];
		return Array.from(new Set(raw.map((t) => String(t)))).filter(Boolean);
	}, [prompt.tags]);

	const navigate = useNavigate();
	const location = useLocation();

	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
	}>({ open: false, message: "" });
	const [isHovered, setIsHovered] = useState(false);

	const isMobile = useMediaQuery("(max-width: 640px)");

	useEffect(() => {
		if (!snackbar.open) return;
		const t = window.setTimeout(
			() => setSnackbar((s) => ({ ...s, open: false })),
			3000,
		);
		return () => window.clearTimeout(t);
	}, [snackbar.open]);

	const handleCopy = async (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(description);
			setSnackbar({
				open: true,
				message: "Successfully copied to clipboard",
			});
		} catch {
			setSnackbar({ open: true, message: "Copy failed" });
		}
	};

	const handleUse = () => {
		navigate("/new", {
			state: {
				...(location.state ?? {}),
				description,
			},
		});
	};

	const handleCloseSnackbar = () => {
		setSnackbar((s) => ({ ...s, open: false }));
	};

	const handleCardClick = (e: React.MouseEvent<HTMLElement>) => {
		if ((e.target as HTMLElement).closest(".card-actions")) return;

		onShowDetails?.(prompt);
	};

	const handleCardKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
		if (
			(e.key !== "Enter" && e.key !== " ") ||
			(e.target as HTMLElement).closest(".card-actions")
		)
			return;

		onShowDetails?.(prompt);
	};

	const displayTime = useMemo(
		() => formatCreatedAt(dateCreated ?? null),
		[dateCreated],
	);

	const snackbarNode = snackbar.open ? (
		<div className="fixed top-4 right-4 z-50">
			<output
				className="flex min-w-[260px] max-w-[420px] items-start justify-between gap-3 rounded-md bg-emerald-600 px-4 py-3 text-sm text-white shadow-lg"
				aria-live="polite"
			>
				<div className="pr-1">{snackbar.message}</div>
				<button
					type="button"
					onClick={handleCloseSnackbar}
					className="rounded-sm p-0.5 opacity-90 hover:opacity-100"
					aria-label="Close notification"
				>
					<X className="h-4 w-4" />
				</button>
			</output>
		</div>
	) : null;

	const deleteDialogNode = isDeleteDialogOpen ? (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
			role="dialog"
			aria-modal="true"
			aria-label="Delete Prompt"
			onMouseDown={(e) => {
				if (e.target === e.currentTarget) setIsDeleteDialogOpen(false);
			}}
		>
			<div className="w-full max-w-md rounded-lg border border-border bg-background shadow-lg">
				<div className="border-border border-b px-4 py-3 font-semibold">
					Delete Prompt
				</div>
				<div className="px-4 py-4 text-muted-foreground text-sm">
					Are you sure you want to delete {String(title ?? "")}? This
					action cannot be undone.
				</div>
				<div className="flex items-center justify-end gap-2 border-border border-t px-4 py-3">
					<Button
						type="button"
						variant="ghost"
						onClick={() => setIsDeleteDialogOpen(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						className="bg-red-600 hover:bg-red-700"
						onClick={() => {
							onDelete();
							setIsDeleteDialogOpen(false);
						}}
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	) : null;
	return (
		<>
			{location.pathname === "/prompt-library" ? (
				<>
					<button
						type="button"
						className={`flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-lg border bg-white transition-[transform,box-shadow] duration-200 ${
							isHovered
								? "-translate-y-0.5 border-slate-200 shadow-md"
								: "border-slate-100 shadow-sm"
						}`}
						onClick={handleCardClick}
						onKeyDown={handleCardKeyDown}
						onMouseEnter={() => setIsHovered(true)}
						onMouseLeave={() => setIsHovered(false)}
					>
						<div className="flex-1 p-4">
							<div className="mb-1 flex items-start justify-between gap-3">
								<div className="min-w-0 flex-1">
									<div className="mb-1 line-clamp-2 font-medium text-[16px] text-slate-800 leading-[1.2]">
										{String(title ?? "")}
									</div>

									{/* {category === "My Prompts" &&
									displayTime ? (
										<div className="mb-1 text-[12px] text-slate-500">
											Created on: {displayTime}
										</div>
									) : null} */}

									{tags.length > 0 ? (
										<div className="mb-1 flex flex-wrap gap-1">
											{tags.slice(0, 3).map((tag) => (
												<span
													key={`${String(id)}:${tag}`}
													className="inline-flex h-5 items-center rounded-md bg-sky-100 px-2 font-medium text-[11px] text-sky-700"
												>
													{tag}
												</span>
											))}
											{tags.length > 3 ? (
												<span className="inline-flex h-5 items-center rounded-md bg-slate-100 px-2 font-medium text-[11px] text-slate-600">
													+{tags.length - 3}
												</span>
											) : null}
										</div>
									) : null}
								</div>

								{isHovered ? (
									<div className="card-actions flex items-center gap-1">
										{category === "My Prompts" ? (
											<>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														onEdit();
													}}
													aria-label="edit"
													className="rounded-md p-1 text-slate-400 hover:bg-black/5 hover:text-slate-500"
												>
													<Pencil className="h-4 w-4" />
												</button>
												<button
													type="button"
													onClick={(e) => {
														e.stopPropagation();
														setIsDeleteDialogOpen(
															true,
														);
													}}
													aria-label="delete"
													className="rounded-md p-1 text-slate-400 hover:bg-black/5 hover:text-red-500"
												>
													<Trash2 className="h-4 w-4" />
												</button>
											</>
										) : null}

										<button
											type="button"
											onClick={handleCopy}
											aria-label="copy"
											className="rounded-md p-1 text-slate-400 hover:bg-black/5 hover:text-slate-500"
										>
											<Copy className="h-4 w-4" />
										</button>
									</div>
								) : null}
							</div>

							<div className="mt-2 line-clamp-2 text-[14px] text-slate-600 leading-6">
								{description}
							</div>
						</div>

						<div className="card-actions p-4 pt-0">
							<Button
								variant="outline"
								className="h-10 w-full justify-center rounded-md border-slate-200 bg-slate-50 text-slate-500 hover:bg-[#d5d5d5] hover:text-slate-700"
								onClick={(e) => {
									e.stopPropagation();
									handleUse();
								}}
							>
								<span>Use Prompt</span>
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</div>
					</button>

					{deleteDialogNode}
					{snackbarNode}
				</>
			) : null}

			{/* {location.pathname === "/" ? (
				<div
					className="flex min-w-[100px] flex-wrap justify-center gap-0"
					style={{
						width: isMobile ? "fit-content" : "100%",
						minHeight: isMobile ? "40px" : "80px",
					}}
				>
					<Button
						key={id}
						variant="outline"
						onClick={() =>
							navigate("/", {
								state: {
									...(location.state ?? {}),
									description,
								},
							})
						}
						className="m-1 w-full flex-col items-start justify-start rounded-lg border-slate-200 bg-slate-50 text-slate-500 hover:bg-[#d5d5d5] hover:text-slate-700"
					>
						<div className="w-full text-left">
							<div className="mb-1 font-semibold text-sm">
								{String(title ?? "")}
							</div>

							{tags.length > 0 ? (
								<div className="mb-1 flex flex-wrap gap-1">
									{tags.slice(0, 3).map((tag) => (
										<span
											key={`${String(id)}:${tag}:home`}
											className="inline-flex h-4 items-center rounded-md bg-sky-100 px-1.5 font-medium text-[9px] text-sky-700"
										>
											{tag}
										</span>
									))}

									{tags.length > 3 ? (
										<Tooltip>
											<TooltipTrigger asChild>
												<span className="inline-flex h-4 cursor-pointer items-center rounded-md bg-slate-100 px-1.5 font-medium text-[9px] text-slate-600 hover:bg-slate-200">
													+{tags.length - 3}
												</span>
											</TooltipTrigger>
											<TooltipContent side="top">
												<div className="flex max-w-xs flex-wrap gap-1 p-1">
													{tags
														.slice(3)
														.map((tag) => (
															<span
																key={`${String(id)}:${tag}:more`}
																className="inline-flex h-5 items-center rounded-md bg-sky-100 px-2 font-medium text-[11px] text-sky-700"
															>
																{tag}
															</span>
														))}
												</div>
											</TooltipContent>
										</Tooltip>
									) : null}
								</div>
							) : null}
						</div>
					</Button>

					{deleteDialogNode}
					{snackbarNode}
				</div>
			) : null} */}
		</>
	);
}
