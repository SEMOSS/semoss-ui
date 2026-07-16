import { Gauge } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Switch,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
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
	restriction: string;
	maxTokens: string;
	maxResponseTime: string;
	frequency: string;
}

const RESTRICTION_LABELS: Record<string, string> = {
	null: "None",
	token: "Token",
	compute: "Compute time",
};

const FREQUENCY_LABELS: Record<string, string> = {
	DAY: "Daily",
	WEEK: "Weekly",
	MONTH: "Monthly",
	YEAR: "Yearly",
	ALL_TIME: "All time",
};

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
	restriction: user.model_usage_restriction ?? "null",
	maxTokens:
		user.model_max_tokens != null ? String(user.model_max_tokens) : "",
	maxResponseTime:
		user.model_max_response_time != null
			? String(user.model_max_response_time)
			: "",
	frequency: user.model_usage_frequency ?? "DAY",
});

export interface MemberProfileFormProps {
	user: SETTINGS_MEMBER;
	/** Called with the updated member after a successful save */
	onSaved: (updated: SETTINGS_MEMBER) => void;
}

/**
 * A single inline view/edit form for a member's profile, roles, and model
 * limits. Values are editable in place and persisted together via Save.
 */
export const MemberProfileForm = ({
	user,
	onSaved,
}: MemberProfileFormProps) => {
	const { adminMode } = useSettings();

	const [form, setForm] = useState<ProfileForm>(() => toForm(user));
	const [initial, setInitial] = useState<ProfileForm>(() => toForm(user));
	const [saving, setSaving] = useState(false);

	// Reseed when a different member is selected
	useEffect(() => {
		const next = toForm(user);
		setForm(next);
		setInitial(next);
	}, [user]);

	const isNative = (user.type ?? "").toUpperCase() === "NATIVE";
	const dirty = useMemo(
		() => JSON.stringify(form) !== JSON.stringify(initial),
		[form, initial],
	);

	const set = (patch: Partial<ProfileForm>) =>
		setForm((prev) => ({ ...prev, ...patch }));

	const reset = () => setForm(initial);

	const save = async () => {
		setSaving(true);
		try {
			const payload: Record<string, unknown> = {
				...user,
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

			// Model usage limits
			if (form.restriction === "null") {
				payload.model_usage_restriction = null;
				payload.model_max_tokens = null;
				payload.model_max_response_time = null;
				payload.model_usage_frequency = null;
			} else {
				payload.model_usage_restriction = form.restriction;
				payload.model_usage_frequency = form.frequency;
				payload.model_max_tokens =
					form.restriction === "token"
						? Number(form.maxTokens) || null
						: null;
				payload.model_max_response_time =
					form.restriction === "compute"
						? Number(form.maxResponseTime) || null
						: null;
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
					model_usage_restriction:
						form.restriction === "null"
							? undefined
							: form.restriction,
					model_usage_frequency:
						form.restriction === "null"
							? undefined
							: form.frequency,
					model_max_tokens:
						form.restriction === "token"
							? Number(form.maxTokens) || undefined
							: undefined,
					model_max_response_time:
						form.restriction === "compute"
							? Number(form.maxResponseTime) || undefined
							: undefined,
				};
				const nextForm = toForm(updated);
				setInitial(nextForm);
				setForm(nextForm);
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
						<Input value={user.type || "—"} disabled />
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

			{/* Model limits */}
			<section className="flex flex-col gap-2">
				<p className="font-medium text-sm">Model Limit Restrictions</p>
				<div className="flex flex-col gap-3 rounded-lg border border-border/60 p-3">
					<div className="flex items-start gap-3">
						<div className="rounded-md bg-muted p-2">
							<Gauge className="size-4 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<p className="font-medium text-sm">Usage limit</p>
							<p className="text-muted-foreground text-xs">
								Cap how much this member can consume model
								resources.
							</p>
						</div>
					</div>

					<ToggleGroup
						type="single"
						variant="outline"
						value={form.restriction}
						onValueChange={(value) => {
							if (!value) {
								return;
							}
							set({
								restriction: value,
								maxTokens: "",
								maxResponseTime: "",
							});
						}}
						className="w-full"
					>
						{Object.entries(RESTRICTION_LABELS).map(
							([value, label]) => (
								<ToggleGroupItem
									key={value}
									value={value}
									className="flex-1"
								>
									{label}
								</ToggleGroupItem>
							),
						)}
					</ToggleGroup>

					{form.restriction === "null" ? (
						<p className="text-muted-foreground text-xs">
							Unrestricted — no usage limits are applied to this
							member.
						</p>
					) : (
						<div className="grid grid-cols-2 gap-2.5">
							{form.restriction === "token" ? (
								<Field label="Max Tokens">
									<Input
										type="number"
										value={form.maxTokens}
										onChange={(e) =>
											set({ maxTokens: e.target.value })
										}
									/>
								</Field>
							) : (
								<Field label="Max Response Time">
									<div className="flex items-center gap-2">
										<Input
											type="number"
											value={form.maxResponseTime}
											onChange={(e) =>
												set({
													maxResponseTime:
														e.target.value,
												})
											}
										/>
										<span className="text-muted-foreground text-sm">
											ms
										</span>
									</div>
								</Field>
							)}
							<Field label="Frequency">
								<Select
									value={form.frequency}
									onValueChange={(value) =>
										set({ frequency: value })
									}
								>
									<SelectTrigger className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{Object.entries(FREQUENCY_LABELS).map(
											([value, label]) => (
												<SelectItem
													key={value}
													value={value}
												>
													{label}
												</SelectItem>
											),
										)}
									</SelectContent>
								</Select>
							</Field>
						</div>
					)}
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
