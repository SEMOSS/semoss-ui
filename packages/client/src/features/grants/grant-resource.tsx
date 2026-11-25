import { AppCatalogAvatar, EngineSubtypeIcon } from "@semoss/shared";
import { ResourceId } from "@/components/shared/resource-id";
import { ResourcePageLink } from "@/components/shared/resource-page-link";

/** Props for {@link GrantResource}. */
export interface GrantResourceProps {
	/** An engine's catalog type, or PROJECT for a project, such as an app or an agent */
	type: string;
	/** Its id */
	id: string;
	/** Its name */
	name: string;
	/** An engine's subtype, for its logo, or a project's type, for its page */
	subtype: string | null;
	/**
	 * Whether the name opens its catalog page in a new tab; a list in a dialog
	 * shows the name alone. Defaults to true.
	 */
	isLinked?: boolean;
}

/**
 * An engine or a project on either side of a permission: a project's image or
 * an engine's logo, its name, which opens its catalog page in a new tab, and
 * its id with a copy button under the name.
 */
export const GrantResource = ({
	type,
	id,
	name,
	subtype,
	isLinked = true,
}: GrantResourceProps) => {
	const isProject = type === "PROJECT";
	return (
		<div className="flex min-w-0 max-w-xs items-center gap-3">
			{isProject ? (
				<AppCatalogAvatar
					projectId={id}
					name={name}
					className="size-8 shrink-0 rounded-md text-xs"
				/>
			) : (
				<EngineSubtypeIcon
					engineType={type}
					engineSubtype={subtype ?? undefined}
					alt=""
					className="size-8 shrink-0 object-contain"
				/>
			)}
			<div className="flex min-w-0 flex-col">
				{isLinked ? (
					<ResourcePageLink
						kind={isProject ? "PROJECT" : "ENGINE"}
						type={isProject ? subtype : type}
						id={id}
						name={name}
					/>
				) : (
					<span className="truncate font-medium text-sm">{name}</span>
				)}
				<ResourceId id={id} name={name} />
			</div>
		</div>
	);
};
