import { Gauge } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ModelUsageLimit } from "@semoss/sdk";
import {
	findModelUsageLimitProblem,
	ModelUsageLimitEditor,
	type ModelUsageLimitEditorHandle,
	toExplicitUsageLimit,
	UsageLimitGuideButton,
} from "@semoss/shared";
import { Button, Input, Label, Switch, toast } from "@semoss/ui/next";
import { editMemberInfo } from "@/api";
import { useSettings } from "@/hooks";
import type { SETTINGS_MEMBER } from "./settings.types";

interface ProfileForm {
	name: string;
	username: string;
	email: string;
	phone: string;
	phoneextension: string;
	password: string;
	admin: boolean;
	publisher: boolean;
	exporter: boolean;
	/** The default for all models, or null for no limit defined */
	usageLimit: ModelUsageLimit | null;
}

const toForm = (user: SETTINGS_MEMBER): ProfileForm => ({
	name: user.name ?? "",
	username: user.username ?? "",
	email: user.email ?? "",
	phone: user.phone ?? "",
	phoneextension: user.phoneextension ?? "",
	password: "",
	admin: !!user.admin,
	publisher: !!user.publisher,
	exporter: !!user.exporter,
	usageLimit: user.model_usage_limit ?? null,
});

export interface MemberProfileFormProps {
	user: SETTINGS_MEMBER;
	/** Called with the updated member after a successful save */
	onSaved: (updated: SETTINGS_MEMBER) => void;
}

/**
 * A single inline view/edit form for a member's profile, roles, and their
 * default usage limit for all models. Values are editable in place and
 * persisted together via Save.
 */
export const MemberProfileForm = ({
	user,
	onSaved,
}: MemberProfileFormProps) => {
	const { adminMode } = useSettings();

	const [form, setForm] = useState<ProfileForm>(() => toForm(user));
	const [initial, setInitial] = useState<ProfileForm>(() => toForm(user));
	const [saving, setSaving] = useState(false);
	// a new key starts the limit editor again, after a reset or a save
	const [limitKey, setLimitKey] = useState(0);
	const limitProblem = findModelUsageLimitProblem(form.usageLimit, {
		source: "ALL_MODELS",
		isCostAvailable: true,
	});
	// the limit's problems show from the first save they stop, until it is
	// saved or reset
	const [shouldShowLimitProblems, setShouldShowLimitProblems] =
		useState(false);
	const limitEditorRef = useRef<ModelUsageLimitEditorHandle>(null);

	// Reseed when a different member is selected
	useEffect(() => {
		const next = toForm(user);
		setForm(next);
		setInitial(next);
		setLimitKey((key) => key + 1);
		setShouldShowLimitProblems(false);
	}, [user]);

	const isNative = (user.type ?? "").toUpperCase() === "NATIVE";
	const dirty = useMemo(
		() => JSON.stringify(form) !== JSON.stringify(initial),
		[form, initial],
	);

	const set = (patch: Partial<ProfileForm>) =>
		setForm((prev) => ({ ...prev, ...patch }));

	const reset = () => {
		setForm(initial);
		setLimitKey((key) => key + 1);
		setShouldShowLimitProblems(false);
	};

	const save = async () => {
		if (limitProblem) {
			setShouldShowLimitProblems(true);
			limitEditorRef.current?.focusFirstProblem();
			return;
		}
		setSaving(true);
		try {
			const payload: Record<string, unknown> = {
				...user,
				// an empty limit says no limit defined, which clears a limit the member has
				model_usage_limit: toExplicitUsageLimit(form.usageLimit),
				name: form.name,
				username: form.username,
				email: form.email,
				phone: form.phone,
				phoneextension: form.phoneextension,
				admin: form.admin,
				publisher: form.publisher,
				exporter: form.exporter,
			};

			// Signal an email change the way the existing edit flow does
			if (form.email !== (user.email ?? "")) {
				payload.newEmail = form.email;
			}
			// Username can be changed for non-native accounts
			if (!isNative && form.username !== (user.username ?? "")) {
				payload.newUsername = form.username;
			}
			// Optional password reset for native accounts
			if (isNative && form.password) {
				payload.password = form.password;
			}

			const response = await editMemberInfo(adminMode, payload);
			if (response?.data) {
				toast.success("Profile saved");
				const updated: SETTINGS_MEMBER = {
					...user,
					name: form.name,
					username: form.username,
					email: form.email,
					phone: form.phone,
					phoneextension: form.phoneextension,
					admin: form.admin,
					publisher: form.publisher,
					exporter: form.exporter,
					model_usage_limit: form.usageLimit,
				};
				const nextForm = toForm(updated);
				setInitial(nextForm);
				setForm(nextForm);
				setShouldShowLimitProblems(false);
				onSaved(updated);
			} else {
				toast.error("Error saving profile");
			}
		} catch (error) {
			toast.error(String(error));
		} finally {
			setSaving(false);
		}
	};

	const roles: {
		key: "admin" | "publisher" | "exporter";
		label: string;
		description: string;
	}[] = [
		{
			key: "admin",
			label: "Admin",
			description: "Complete access to the platform",
		},
		{
			key: "publisher",
			label: "Publisher",
			description: "Able to upload data to the platform",
		},
		{
			key: "exporter",
			label: "Exporter",
			description: "Able to export data from the platform",
		},
	];

	return (
		<div className="flex flex-col gap-4">
			{/* Account (read-only identity) */}
			<section className="flex flex-col gap-2">
				<p className="font-medium text-sm">Account</p>
				<div className="grid gap-2.5 sm:grid-cols-2">
					<Field label="User Id">
						<Input value={user.id} disabled />
					</Field>
					<Field label="Login Type">
						<Input value={user.type || "-"} disabled />
					</Field>
				</div>
			</section>

			{/* Details */}
			<section className="flex flex-col gap-2">
				<p className="font-medium text-sm">Details</p>
				<div className="grid gap-2.5 sm:grid-cols-2">
					<Field label="Name">
						<Input
							value={form.name}
							onChange={(e) => set({ name: e.target.value })}
						/>
					</Field>
					<Field label="Username">
						<Input
							value={form.username}
							disabled={isNative}
							placeholder={
								isNative ? "Managed by native login" : undefined
							}
							onChange={(e) => set({ username: e.target.value })}
						/>
					</Field>
					<Field label="Email">
						<Input
							type="email"
							value={form.email}
							onChange={(e) => set({ email: e.target.value })}
						/>
					</Field>
					<Field label="Phone Number">
						<Input
							value={form.phone}
							onChange={(e) => set({ phone: e.target.value })}
						/>
					</Field>
					<Field label="Extension">
						<Input
							value={form.phoneextension}
							onChange={(e) =>
								set({ phoneextension: e.target.value })
							}
						/>
					</Field>
					{isNative ? (
						<Field label="Reset Password">
							<Input
								type="password"
								placeholder="Leave blank to keep current"
								value={form.password}
								onChange={(e) =>
									set({ password: e.target.value })
								}
							/>
						</Field>
					) : null}
				</div>
			</section>

			{/* the default usage limit for all models */}
			<section className="flex flex-col gap-2">
				<p className="font-medium text-sm">User's Total Model Limit</p>
				<div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
					<div className="flex items-start gap-3">
						<div className="rounded-md bg-muted p-2">
							<Gauge
								className="size-4 text-muted-foreground"
								aria-hidden
							/>
						</div>
						<p className="flex-1 text-muted-foreground text-xs">
							This member's limit on any model where nothing more
							specific applies: a Direct Limit, a Team Limit or
							the Public Use Limit. Cost rules do not count models
							without known prices.
						</p>
					</div>
					<ModelUsageLimitEditor
						key={limitKey}
						ref={limitEditorRef}
						defaultValue={form.usageLimit}
						onChange={(usageLimit) => set({ usageLimit })}
						source="ALL_MODELS"
						label="Usage Limit"
						shouldShowProblems={shouldShowLimitProblems}
						disabled={saving}
					/>
					<UsageLimitGuideButton
						className="self-start"
						viewer={{ isAdminMode: true }}
					/>
				</div>
			</section>

			{/* Roles */}
			<section className="flex flex-col gap-2">
				<p className="font-medium text-sm">Roles</p>
				{roles.map((role) => (
					<div
						key={role.key}
						className="flex items-center justify-between gap-4 rounded-md border border-border/60 p-2.5"
					>
						<div>
							<p className="font-medium text-sm">{role.label}</p>
							<p className="text-muted-foreground text-xs">
								{role.description}
							</p>
						</div>
						<Switch
							checked={form[role.key]}
							onCheckedChange={(checked) =>
								set({ [role.key]: checked })
							}
						/>
					</div>
				))}
			</section>

			{/* Actions */}
			<div className="sticky bottom-0 flex justify-end gap-2 border-border/60 border-t bg-background py-2">
				<Button
					variant="outline"
					disabled={!dirty || saving}
					onClick={reset}
				>
					Reset
				</Button>
				<Button disabled={!dirty || saving} onClick={save}>
					{saving ? "Saving..." : "Save"}
				</Button>
			</div>
		</div>
	);
};

const Field = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<div className="flex flex-col gap-1">
		<Label className="text-muted-foreground text-xs">{label}</Label>
		{children}
	</div>
);
