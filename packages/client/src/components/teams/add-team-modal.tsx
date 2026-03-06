import { Users, X } from "lucide-react";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	Input,
	Select,
	type SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { addTeam, editTeam } from "@/api/teams";
import AMAZON_S3 from "@/assets/loginProviders/Amazon_S3.png";
import ADFS from "@/assets/loginProviders/adfs_microsoft_1.png";
import Dropbox from "@/assets/loginProviders/dropbox.png";
import Github from "@/assets/loginProviders/github.png";
import Gitlab from "@/assets/loginProviders/gitlab.png";
import newGoogle from "@/assets/loginProviders/google.png";
import Keycloak from "@/assets/loginProviders/keycloak.png";
import Linkedin from "@/assets/loginProviders/linkedin.png";
import Microsoft from "@/assets/loginProviders/microsoft.png";
import Okta from "@/assets/loginProviders/okta.png";
import ProductHunt from "@/assets/loginProviders/product_hunt.png";
import Salesforce from "@/assets/loginProviders/salesforce.png";
import Saml from "@/assets/loginProviders/saml.png";
import Siteminder from "@/assets/loginProviders/siteminder.png";
import Surverymonkey from "@/assets/loginProviders/surveymonkey.png";
import Twitter from "@/assets/loginProviders/x_twitter.png";
import { useRootStore } from "@/hooks";

const TypeImageObject = {
	native: AMAZON_S3,
	google: newGoogle,
	github: Github,
	okta: Okta,
	dropbox: Dropbox,
	adfs: ADFS,
	gitlab: Gitlab,
	keycloak: Keycloak,
	linkedin: Linkedin,
	ms: Microsoft,
	product_hunt: ProductHunt,
	salesforce: Salesforce,
	saml: Saml,
	siteminder: Siteminder,
	surveymonkey: Surverymonkey,
	twitter: Twitter,
};

type TeamReturn = {
	id: string;
	type: string;
	description: string;
	previousTeamName?: string;
};

type NewTeamForm = {
	TEAM_NAME: string;
	TEAM_DESCRIPTION: string;
	TEAM_TYPE: string;
};

interface AddTeamModalProps {
	/**
	 * Open state
	 */
	open: boolean;

	/**
	 * What happens when team is created
	 * @param team
	 * @returns
	 */
	// eslint-disable-next-line no-unused-vars
	onClose: (team?: TeamReturn) => void;
	isEdit?: boolean;
	id?: string;
	type?: string;
	description?: string;
}

export const AddTeamModal = (props: AddTeamModalProps) => {
	const { open, onClose, isEdit, id, type, description } = props;

	const navigate = useNavigate();
	const { configStore } = useRootStore();

	// State to track the previous team name, type
	const [previousTeamName, setPreviousTeamName] = React.useState<
		string | undefined
	>(id);
	const [_previousType, setPreviousType] = React.useState<string | undefined>(
		id,
	);
	const {
		handleSubmit,
		control,
		reset,
		formState: { isValid },
		watch,
	} = useForm<NewTeamForm>({
		defaultValues: {
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: type,
		},
		mode: "onChange", // Ensures validation updates on field changes
	});

	useEffect(() => {
		reset({
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: type,
		});

		// Update the previous team name when the modal is opened
		setPreviousTeamName(id);
		setPreviousType(type);
	}, [id, type, description, reset]);

	const selectedTeamType = watch("TEAM_TYPE");

	const loginTypes = [
		{
			provider: "CUSTOM",
			name: "Custom",
			description: "Directly manage users in the team",
			isOauth: false,
		},
		...configStore.store.config.availableProviders,
	] as {
		provider: string;
		name: string;
		isOauth: boolean;
		description?: string;
	}[];

	/**
	 * Method that is called to create the team
	 */
	const onSubmit = handleSubmit(async (data: NewTeamForm) => {
		if (isEdit) {
			// Logic for editing the team
			try {
				const response = await editTeam(
					data.TEAM_NAME,
					data.TEAM_DESCRIPTION,
					data.TEAM_TYPE,
					previousTeamName,
					data.TEAM_TYPE,
				);
				if (response.data) {
					onClose({
						id: data.TEAM_NAME,
						type: data.TEAM_TYPE,
						description: data.TEAM_DESCRIPTION,
						previousTeamName: previousTeamName,
					});
					reset();
					toast.success("Successfully updated team");
				} else {
					throw new Error("Failed to update team");
				}
			} catch (e) {
				console.error(e);
				toast.error("Error updating team");
			}
		} else {
			// Logic for creating a new team
			try {
				const response = await addTeam(
					data.TEAM_NAME,
					data.TEAM_DESCRIPTION,
					false,
					data.TEAM_TYPE,
				);
				if (response.data) {
					onClose({
						id: data.TEAM_NAME,
						type: data.TEAM_TYPE,
						description: data.TEAM_DESCRIPTION,
					});
					reset();
					toast.success("Successfully added team");
					navigate(
						`${encodeURIComponent(data.TEAM_TYPE)}/${encodeURIComponent(data.TEAM_NAME)}`,
					);
				} else {
					throw new Error("Failed to add team");
				}
			} catch (e) {
				console.error(e);
				toast.error("Error adding team");
			}
		}
	});

	return (
		<Dialog open=
{
	open;
}
onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="max-w-[550px]" showCloseButton={false}>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-foreground">
							{isEdit ? "Edit Team" : "Create New Team"}
						</DialogTitle>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								reset();
								onClose();
							}}
							className="hover:bg-accent"
						>
							<X className="size-4" />
						</Button>
					</div>
				</DialogHeader>
				<form onSubmit={onSubmit}>
					<div className="flex flex-col gap-4 pb-4">
						<Field>
							<Controller
								name="TEAM_TYPE"
								control={control}
								rules={{
									required: "Please select a team type",
								}}
								render={({ field, fieldState: { error } }) => {
									const filteredLoginTypes = loginTypes
										.sort()
										.filter(
											(p) =>
												![
													"native",
													"registration",
												].includes(p.provider),
										);
									return (
										<>
											<FieldLabel>
												Type
											<span className="text-destructive">
												*
											</span>
									</FieldLabel>
											<Select
												value=
													field.value
														? field.value
														: ""
												onValueChange={(value) =>
													field.onChange(value)
												}
												disabled={isEdit}
											>
												<SelectTrigger
													className="w-full"
													aria-invalid={!!error}
												>
													<SelectValue placeholder="Select a team type" />
												</SelectTrigger>
												<SelectContent>loginTypes
														.sort()
														.filter(
															(p) =>
																![
																	"native",
																	"registration",
																].includes(
																	p.provider,
																),
														)
														.map((p) => {
															return (
																<SelectItem
																	key={`logintype-${p.provider}`}
																	value={
																		p.provider
																	}
																	className={
																		p.provider ===
																		"CUSTOM"
																			? "border-border border-b"
																			: ""
																	}
																>
																	<div className="flex flex-row items-center gap-6">
																		{TypeImageObject[
																			p
																				.provider
																		] ? (
																			<img
																				src={
																					TypeImageObject[
																						p
																							.provider
																					]
																				}
																				className="h-6 w-6"
																				alt="login provider icon"
																			/>
																		) : (
																			<Users className="h-6 w-6 text-muted-foreground" />
																		)}
																		<span>
																			{
																				p.name
																			}
																		</span>
																		{p.description && (
																			<span className="text-muted-foreground text-xs italic">
																				{
																					p.description
																				}
																			</span>
																		)}
																	</div>
																</SelectItem>
															);
														})
												</SelectContent>
											</Select>error && (
												<FieldError>
													{error.message}
												</FieldError>
											)
										</>
									);
								}}
							/>
						</Field>

						<Field>
							<Controller
								name="TEAM_NAME"
								control={control}
								rules={{ required: "Team name is required" }}
								render={({ field, fieldState: { error } }) => {
									return (
										<>
											<FieldLabel>Name
												<span className="text-destructive">
												*
											</span>
											</FieldLabel>
											<Input
												value={
													field.value
														? field.value
														: ""
												}
												onChange={(e) =>
													field.onChange(
														e.target.value,
													)
												}
												disabled={
													isEdit &&
													selectedTeamType !==
														"CUSTOM"
												}
												aria-invalid={!!error}
											/>
											{selectedTeamType !== "CUSTOM" &&
											selectedTeamType !== "" ? (
												<FieldDescription className="pl-3.5 text-[#666666] text-[12px] leading-[20px] tracking-[0.4px]">
													Must be the name of the
													group/team from your IdP
												</FieldDescription>
											) : null}
											{error && (
												<FieldError>
													{error.message}
												</FieldError>
											)}
										</>
									);
								}}
							/>
						</Field>

						<Field>
							<Controller
								name="TEAM_DESCRIPTION"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<>
											<FieldLabel>Description</FieldLabel>
											<Textarea
												value=
{
	field.value ? field.value : "";
}
onChange={(e) =>
													field.onChange(
														e.target.value,
)
												}
												rows=
{
	2;
}
className="max-h-[150px] resize-none"
											/>
</>
									)
}}
							/>
						</Field>
					</div>
					<DialogFooter>
						<div className="flex flex-row gap-2">
							<Button
type = "button";
variant = "ghost";
onClick={() => {
									reset();
onClose();
}}
							>
								Cancel
							</Button>
							<Button
type = "submit";
disabled={!isValid}>
								{isEdit ? "Update" : "Add"}
</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
