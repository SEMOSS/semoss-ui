import { MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import React, { useState } from "react";
import {
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { deleteTeam } from "@/api/teams";
import AMAZON_S3 from "@/assets/img/AMAZON_S3.png";
import Dropbox from "@/assets/img/DROPBOX.png";
import Github from "@/assets/img/GITHUB.svg";
import newGoogle from "@/assets/img/GOOGLE.svg";
import Microsoft from "@/assets/img/MICROSOFT.png";
import CAC from "@/assets/loginProviders/CAC.svg";
import Generic from "@/assets/loginProviders/GENERIC.svg";
import Gitlab from "@/assets/loginProviders/GITLAB.svg";
import Keycloak from "@/assets/loginProviders/KEYCLOAK.svg";
import Linkedin from "@/assets/loginProviders/LINKEDIN.svg";
import Okta from "@/assets/loginProviders/OKTA.svg";
import ProductHunt from "@/assets/loginProviders/product_hunt.png";
import Salesforce from "@/assets/loginProviders/SALESFORCE.svg";
import Surverymonkey from "@/assets/loginProviders/SURVEYMONKEY.svg";
import Saml from "@/assets/loginProviders/saml.png";
import Siteminder from "@/assets/loginProviders/siteminder.png";
import Twitter from "@/assets/loginProviders/X_TWITTER.svg";
import { AddTeamModal } from "./add-team-modal";
import { TeamDeleteDialog } from "./team-delete-dialog";

const TypeImageObject = {
	native: AMAZON_S3,
	google: newGoogle,
	github: Github,
	okta: Okta,
	cac: CAC,
	dropbox: Dropbox,
	adfs: Microsoft,
	generic: Generic,
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

interface TeamCardProps {
	/** ID of team */
	id: string;

	/** Description of the team */
	description: string;

	/** Type of the team */
	type: string;

	/** dispatch function */
	dispatch: (val: { type: string; field: string; value: unknown[] }) => void;

	/** databases to update */
	teams;

	/** Callback when this team is deleted */
	onDelete?: () => void;

	onClick?: (value: string) => void;
}

export const TeamTileCard = (props: TeamCardProps) => {
	const { id, description, type, dispatch, teams, onDelete, onClick } = props;

	const [deleteModal, setDeleteModal] = React.useState(false);
	const [editTeam, setEditTeam] = useState(false);

	const descriptionText = description
		? description.replace(/['"]+/g, "")
		: "No description available";

	const deleteGroup = async () => {
		try {
			const response = await deleteTeam(id, type);
			if (
				typeof response === "boolean"
					? response
					: response?.data?.success === false
			) {
				throw new Error("Failed to delete team");
			}
			dispatch({
				type: "field",
				field: "teams",
				value: [...teams.filter((val) => val.id !== id)],
			});
			onDelete?.();
			toast.success("Successfully deleted team");
		} catch (e) {
			console.error(e);
			toast.error(e instanceof Error ? e.message : String(e));
		} finally {
			setDeleteModal(false);
		}
	};

	const providerKey = type ? type.toLowerCase() : "";
	const providerIcon = TypeImageObject[providerKey];

	return (
		<React.Fragment>
			{/* biome-ignore lint/a11y/useSemanticElements: card contains nested interactive elements, cannot use button */}
			<div
				className="max-h-[200px] w-full min-w-[288px] cursor-pointer rounded-xl border bg-background p-2 shadow-sm transition-shadow hover:shadow-md"
				role="button"
				tabIndex={0}
				onClick={() => onClick(id)}
				onKeyDown={(e) => e.key === "Enter" && onClick(id)}
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2 overflow-hidden">
						{providerIcon ? (
							<img
								src={providerIcon}
								alt={`${type} icon`}
								className="size-5 shrink-0"
							/>
						) : (
							<Users className="size-4 shrink-0 text-muted-foreground" />
						)}
						<span className="block max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap text-base leading-6">
							{id}
						</span>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreHorizontal className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								onClick={(e) => {
									e.stopPropagation();
									setEditTeam(true);
								}}
							>
								<Pencil className="mr-2 size-4" />
								Edit team
							</DropdownMenuItem>
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									setDeleteModal(true);
								}}
							>
								<Trash2 className="mr-2 size-4" />
								Delete team
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
				<p className="mt-2 line-clamp-4 min-h-[80px] max-w-[256px] overflow-hidden text-ellipsis text-muted-foreground text-sm">
					{descriptionText}
				</p>
			</div>
			<TeamDeleteDialog
				open={deleteModal}
				onOpenChange={setDeleteModal}
				teamId={id}
				onConfirm={deleteGroup}
			/>
			<AddTeamModal
				open={editTeam}
				isEdit={true}
				type={type}
				id={id}
				description={description}
				onClose={(team) => {
					if (team) {
						const updatedTeams = teams.map((t) =>
							t.id === team.previousTeamName
								? {
										id: team.id,
										description: team.description,
										type: team.type,
									}
								: t,
						);

						dispatch({
							type: "field",
							field: "teams",
							value: updatedTeams,
						});
					}
					setEditTeam(false);
				}}
			/>
		</React.Fragment>
	);
};
