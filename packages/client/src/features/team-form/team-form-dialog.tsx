import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	FormSelect,
	FormSelectItem,
	FormTextarea,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { addTeam, editTeam, type TeamSummary } from "@/api/teams";
import { CUSTOM_TEAM_TYPE } from "@/features/team-type/team-type";
import { TeamTypeIcon } from "@/features/team-type/team-type-icon";
import { useTeamTypeName } from "@/features/team-type/use-team-type-name";
import { useConfig } from "@/hooks";

/** Native logins have no groups, so a team cannot mirror one */
const NATIVE_PROVIDER = "NATIVE";

/**
 * The form's rules
 * @param currentName - the edited team's name, which stays valid as it is, so a
 * team saved before names were checked keeps its name and can still be saved
 * @returns the schema
 */
const buildSchema = (currentName?: string) =>
	z.object({
		type: z.string().min(1, "Choose where the team's members come from"),
		name: z
			.string()
			.trim()
			.min(1, "Name is required")
			.max(255, "Use 255 characters or fewer")
			// the backend escapes team names each time it reads one, so a newly
			// stored apostrophe could never be matched again
			.refine(
				(name) => name === currentName || !name.includes("'"),
				"Names cannot contain an apostrophe (')",
			),
		description: z
			.string()
			.trim()
			.max(2000, "Use 2000 characters or fewer"),
	});

type TeamFormValues = z.infer<ReturnType<typeof buildSchema>>;

export interface TeamFormDialogProps {
	/** Whether the dialog is open */
	open: boolean;
	/** The team to edit, or null to create one */
	team: TeamSummary | null;
	/** Called when the dialog closes: with the saved team after a save, or nothing */
	onClose: (saved?: TeamSummary) => void;
}

/**
 * Creates a team, or edits a team's name and description. Admins only. Mount it
 * with a key per team so the form starts from that team's values.
 */
export const TeamFormDialog = ({
	open,
	team,
	onClose,
}: TeamFormDialogProps) => {
	const availableProviders = useConfig(
		(state) => state.config.availableProviders,
	);
	const isEdit = team !== null;
	const form = useForm<TeamFormValues>({
		resolver: zodResolver(buildSchema(team?.id)),
		defaultValues: {
			type: team?.type ?? CUSTOM_TEAM_TYPE,
			name: team?.id ?? "",
			description: team?.description ?? "",
		},
	});
	const { errors, isSubmitting } = form.formState;
	const type = form.watch("type");
	const currentTypeName = useTeamTypeName(type);
	// the providers whose groups a team can mirror, keyed by the type a team stores
	const groupProviders = availableProviders
		.map((provider) => ({
			value: provider.label ?? provider.provider,
			name: provider.name,
		}))
		.filter((provider) => provider.value.toUpperCase() !== NATIVE_PROVIDER);
	const selectedProvider = groupProviders.find(
		(provider) => provider.value === type,
	);
	// an edited team keeps its type even when this server no longer lists the provider
	const showCurrentType =
		isEdit && type !== CUSTOM_TEAM_TYPE && selectedProvider === undefined;

	const handleSubmit = async (values: TeamFormValues): Promise<void> => {
		const savedType = team ? team.type : values.type;
		try {
			if (team) {
				await editTeam(
					values.name,
					values.description,
					team.id,
					team.type,
				);
			} else {
				await addTeam(
					values.name,
					values.description,
					false,
					values.type,
				);
			}
		} catch (e: unknown) {
			form.setError("root.server", {
				type: "server",
				message: getErrorMessage(
					e,
					team
						? "Could not save the team"
						: "Could not create the team",
				),
			});
			return;
		}
		toast.success(team ? "Team saved" : "Team created");
		onClose({
			id: values.name,
			type: savedType,
			description: values.description || null,
			dateAdded: team?.dateAdded ?? null,
			managerSince: team?.managerSince ?? null,
			memberCount: team?.memberCount ?? null,
		});
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				if (!isOpen && !isSubmitting) {
					onClose();
				}
			}}
		>
			<DialogContent>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex flex-col gap-6"
				>
					<DialogHeader>
						<DialogTitle className="font-medium text-base leading-6">
							{isEdit ? "Edit Team" : "New Team"}
						</DialogTitle>
						<DialogDescription>
							{isEdit
								? "Change the team's name or description."
								: "A team gives a group of people the same access to projects and engines."}
						</DialogDescription>
					</DialogHeader>

					<div className="flex flex-col gap-4">
						<FormSelect
							name="type"
							label="Members Come From"
							description={
								type === CUSTOM_TEAM_TYPE
									? "You and the team's managers choose its members."
									: `Members are the people in this ${selectedProvider?.name ?? type} group.`
							}
							disabled={isEdit || isSubmitting}
							triggerClassName="w-full"
						>
							<FormSelectItem value={CUSTOM_TEAM_TYPE}>
								<span className="flex items-center gap-2">
									<TeamTypeIcon
										type={CUSTOM_TEAM_TYPE}
										name="Custom"
									/>
									Custom (defined in this platform)
								</span>
							</FormSelectItem>
							{groupProviders.map((provider) => (
								<FormSelectItem
									key={provider.value}
									value={provider.value}
								>
									<span className="flex items-center gap-2">
										<TeamTypeIcon
											type={provider.value}
											name={provider.name}
										/>
										{provider.name}
									</span>
								</FormSelectItem>
							))}
							{showCurrentType ? (
								<FormSelectItem value={type}>
									<span className="flex items-center gap-2">
										<TeamTypeIcon
											type={type}
											name={currentTypeName}
										/>
										{currentTypeName}
									</span>
								</FormSelectItem>
							) : null}
						</FormSelect>
						<FormInput
							name="name"
							label="Name"
							description={
								type === CUSTOM_TEAM_TYPE
									? undefined
									: "Use the group's name in the login provider."
							}
							required
							autoComplete="off"
							disabled={
								isSubmitting ||
								(isEdit && type !== CUSTOM_TEAM_TYPE)
							}
						/>
						<FormTextarea
							name="description"
							label="Description"
							rows={3}
							disabled={isSubmitting}
						/>
					</div>

					{errors.root?.server?.message ? (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					) : null}

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => onClose()}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting ? <Spinner /> : null}
							{isEdit
								? isSubmitting
									? "Saving..."
									: "Save"
								: isSubmitting
									? "Creating..."
									: "Create Team"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
