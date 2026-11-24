import { Plus, RefreshCw, SearchIcon } from "lucide-react";
import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Muted,
	useDebouncedValue,
} from "@semoss/ui/next";
import { AddGrantedAccessDialog } from "./add-granted-access-dialog";
import { GRANT_KINDS } from "./grant-pairs";
import { GrantSection } from "./grant-section";
import { useShareableKinds } from "./use-shareable-kinds";

/** Props for {@link GrantedAccess}. */
export interface GrantedAccessProps {
	/**
	 * Whether to list and change every engine's and project's permissions, in
	 * admin mode; outside it an admin has only their own permissions
	 */
	admin?: boolean;
}

/**
 * The permissions engines and projects give apps, agents and engines, all in
 * one place: the ones on every engine and project the user can edit, or on
 * every one in admin mode. They are split into what apps and agents use of
 * projects, what they use of engines, and what engines use of engines, each a
 * section with its own type filters and pages (`GrantSection`); the search
 * above them narrows all three. Add Access gives one app, agent or engine
 * access to many engines and projects at once, and every section is read again
 * after it saves. Outside admin mode it offers only the types the user can
 * share: a note names the types only admins give access to, and Add Access is
 * left out when that is every type.
 */
export const GrantedAccess = ({ admin = false }: GrantedAccessProps) => {
	const [search, setSearch] = useState("");
	const [version, setVersion] = useState(0);
	const [isAddOpen, setIsAddOpen] = useState(false);
	const [addDialogKey, setAddDialogKey] = useState(0);
	const debouncedSearch = useDebouncedValue(search);
	const { kinds, adminOnlyNote } = useShareableKinds(admin);
	const canAdd = kinds.length > 0;

	return (
		<div className="flex flex-col gap-6">
			<Muted className="font-normal">
				{admin
					? "Every permission an engine or a project gives an app, an agent or another engine."
					: "The permissions the engines and projects you can edit give apps, agents and other engines."}{" "}
				An app's custom reactors, an agent's runs, and an engine's own
				code use each one, even for people with no access of their own.
				Each permission is kept on the engine or project that gives it,
				whose owners change it here or on its Access Control tab.
			</Muted>

			{adminOnlyNote ? (
				<Alert>
					<AlertDescription>
						{adminOnlyNote} You can still change or take away the
						access already given.
					</AlertDescription>
				</Alert>
			) : null}

			<div className="flex flex-wrap items-center gap-3">
				<InputGroup className="w-full lg:max-w-xs">
					<InputGroupAddon>
						<SearchIcon
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Search by name or id"
						aria-label="Search permissions"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
					/>
				</InputGroup>
				<div className="ml-auto flex items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={() => setVersion((current) => current + 1)}
					>
						<RefreshCw className="size-4" aria-hidden />
						Refresh
					</Button>
					{canAdd ? (
						<Button
							type="button"
							size="sm"
							onClick={() => {
								setAddDialogKey((key) => key + 1);
								setIsAddOpen(true);
							}}
						>
							<Plus className="size-4" aria-hidden />
							Add Access
						</Button>
					) : null}
				</div>
			</div>

			{GRANT_KINDS.map((grantKind) => (
				<GrantSection
					key={grantKind.id}
					grantKind={grantKind}
					search={debouncedSearch.trim()}
					admin={admin}
					version={version}
				/>
			))}

			{canAdd ? (
				<AddGrantedAccessDialog
					key={addDialogKey}
					open={isAddOpen}
					admin={admin}
					onClose={(didSave) => {
						setIsAddOpen(false);
						if (didSave) {
							setVersion((current) => current + 1);
						}
					}}
				/>
			) : null}
		</div>
	);
};
