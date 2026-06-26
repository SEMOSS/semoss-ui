import {
	ChevronRight,
	Plus,
	Search,
	ShieldCheck,
	Users,
	X,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks/";
import { useNavigate } from "@/hooks/useNavigate";

interface PlatformProfile {
	profileId: string;
	profileName: string;
	description: string;
	userCount: number;
}

const escapePixelString = (s: string) => s.replaceAll("'", "\\'");

export const PlatformProfilesPage = observer(() => {
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();
	const nameId = useId();
	const descId = useId();

	const [profiles, setProfiles] = useState<PlatformProfile[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");

	// New profile modal
	const [showModal, setShowModal] = useState(false);
	const [formName, setFormName] = useState("");
	const [formDesc, setFormDesc] = useState("");
	const [saving, setSaving] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: loadProfiles is defined in component scope
	useEffect(() => {
		loadProfiles();
	}, []);

	async function runPixel<T = unknown>(pixel: string): Promise<T | null> {
		const response = await monolithStore.runQuery(pixel);
		const { operationType, output } = response.pixelReturn[0];
		if (operationType.indexOf("ERROR") > -1) {
			toast.error(
				typeof output === "string" ? output : "Operation failed.",
			);
			return null;
		}
		return output as T;
	}

	async function loadProfiles() {
		setLoading(true);
		try {
			const result = await runPixel<PlatformProfile[]>(
				"GetPlatformProfiles();",
			);
			if (result) setProfiles(result);
		} finally {
			setLoading(false);
		}
	}

	function openModal() {
		setFormName("");
		setFormDesc("");
		setShowModal(true);
	}

	function closeModal() {
		setShowModal(false);
		setFormName("");
		setFormDesc("");
	}

	async function handleCreate() {
		const name = escapePixelString(formName.trim());
		if (!name) {
			toast.error("Profile name is required.");
			return;
		}
		const desc = escapePixelString(formDesc);
		setSaving(true);
		try {
			const result = await runPixel<{ profileId: string }>(
				`CreatePlatformProfile(name="${name}", description="${desc}");`,
			);
			if (result?.profileId) {
				await loadProfiles();
				closeModal();
				navigate(result.profileId);
			}
		} finally {
			setSaving(false);
		}
	}

	const filteredProfiles = search.trim()
		? profiles.filter((p) =>
				p.profileName
					.toLowerCase()
					.includes(search.trim().toLowerCase()),
			)
		: profiles;

	return (
		<div className="flex w-full flex-col gap-6">
			{/* Toolbar */}
			<div className="flex items-center gap-3">
				<div className="relative flex-1">
					<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 size-4 text-muted-foreground" />
					<Input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search profiles"
						className="h-11 pl-9"
						data-testid="platform-profiles-search"
					/>
				</div>
				<Button
					className="shrink-0 gap-2"
					onClick={openModal}
					data-testid="new-platform-profile-btn"
				>
					<Plus className="size-4" />
					New Profile
				</Button>
			</div>

			{/* Profile grid */}
			{loading ? (
				<div className="flex items-center justify-center py-16">
					<p className="text-muted-foreground text-sm">
						Loading profiles…
					</p>
				</div>
			) : profiles.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
					<div className="rounded-full bg-muted p-4">
						<ShieldCheck className="size-6 text-muted-foreground" />
					</div>
					<div className="flex flex-col gap-1">
						<p className="font-medium">No profiles yet</p>
						<p className="max-w-xs text-muted-foreground text-sm">
							Create your first platform profile to start
							restricting navigation for specific users.
						</p>
					</div>
					<Button onClick={openModal} className="gap-2">
						<Plus className="size-4" />
						Create Profile
					</Button>
				</div>
			) : filteredProfiles.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-lg border border-dashed py-16 text-center">
					<p className="text-muted-foreground text-sm">
						No profiles match &ldquo;{search}&rdquo;.
					</p>
				</div>
			) : (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{filteredProfiles.map((p) => (
						<button
							key={p.profileId}
							type="button"
							className="group flex flex-col gap-3 rounded-xl border bg-card p-5 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							data-testid={`platform-profile-card-${p.profileId}`}
							onClick={() => navigate(p.profileId)}
						>
							<div className="flex items-start justify-between gap-2">
								<div className="flex min-w-0 flex-col gap-1">
									<span className="truncate font-semibold text-base">
										{p.profileName}
									</span>
									{p.description ? (
										<p className="line-clamp-2 text-muted-foreground text-sm">
											{p.description}
										</p>
									) : (
										<p className="text-muted-foreground/60 text-sm italic">
											No description
										</p>
									)}
								</div>
								<ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
							</div>
							<div className="flex items-center gap-1.5 text-muted-foreground text-xs">
								<Users className="size-3.5" />
								<span>
									{p.userCount}{" "}
									{p.userCount === 1 ? "user" : "users"}{" "}
									assigned
								</span>
							</div>
						</button>
					))}
				</div>
			)}

			{/* ── New Profile modal ────────────────────────────────────────── */}
			<Dialog
				open={showModal}
				onOpenChange={(isOpen) => !isOpen && closeModal()}
			>
				<DialogContent
					className="max-w-[480px] gap-6 rounded-xl"
					showCloseButton={false}
				>
					<DialogHeader>
						<div className="flex items-center justify-between">
							<DialogTitle>New Platform Profile</DialogTitle>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={closeModal}
								className="hover:bg-accent"
							>
								<X className="size-4" />
							</Button>
						</div>
					</DialogHeader>
					<div className="flex flex-col gap-4 pb-2">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={nameId}>
								Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id={nameId}
								placeholder="e.g. Restricted Access, Read Only"
								value={formName}
								onChange={(e) => setFormName(e.target.value)}
								maxLength={100}
								autoFocus
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor={descId}>Description</Label>
							<Textarea
								id={descId}
								placeholder="What kind of users does this profile apply to?"
								value={formDesc}
								onChange={(e) => setFormDesc(e.target.value)}
								rows={3}
								className="max-h-[120px] resize-none"
							/>
						</div>
					</div>
					<DialogFooter>
						<div className="flex flex-row gap-2">
							<Button
								variant="ghost"
								onClick={closeModal}
								disabled={saving}
							>
								Cancel
							</Button>
							<Button
								onClick={handleCreate}
								disabled={saving || !formName.trim()}
								data-testid="save-platform-profile-btn"
							>
								{saving ? "Creating…" : "Create Profile"}
							</Button>
						</div>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
});
