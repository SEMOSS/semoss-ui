import { UploadIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useIteratorPixel } from "@semoss/sdk/react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Muted,
	P,
	Spinner,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import {
	CatalogFilterBox,
	CatalogGrid,
	CatalogLayout,
	CatalogSearchBar,
} from "@/components/catalog";
import { NewAppChatComposer, NewAppTemplateCard } from "@/components/new-app";
import { CloneProjectDialog, UploadProjectDialog } from "@/components/project";
import { NavbarHeader, NavbarLeft } from "@/components/shared";
import { TYPE_TO_ROUTE } from "@/constants";
import { useRootStore } from "@/hooks";

/** Displays the template catalog used to create a new app. */
export const CreateAppPage: React.FC = observer((): JSX.Element => {
	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const metaKeys = configStore.store.config.projectMetaKeys
		.filter((metaKey) => {
			return [
				"single-checklist",
				"multi-checklist",
				"single-select",
				"multi-select",
				"single-typeahead",
				"multi-typeahead",
				"select-box",
			].includes(metaKey.display_options);
		})
		.map((metaKey) => metaKey.metakey);
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [sortValue, setSortValue] = useState("PROJECTNAME");
	const [sortOrder, setSortOrder] = useState<"ASC" | "DESC">("ASC");
	const [cloneTemplate, setCloneTemplate] = useState<Project | null>(null);
	const [isUploadOpen, setIsUploadOpen] = useState(false);
	const [metaFilters, setMetaFilters] = useState<Record<string, unknown>>({});
	const metaKeysDescription = [...metaKeys, "description"];

	const getTemplates = useIteratorPixel<Project[], Project>(
		(limit, offset) =>
			`MyProjects(metaKeys = ${JSON.stringify(
				metaKeysDescription,
			)}, ${debouncedSearch ? `filterWord=["${debouncedSearch}"], ` : ""} ${Object.keys(metaFilters).length > 0 ? `metaFilters=[${JSON.stringify(metaFilters)}],` : ""} sort=[{"${sortValue}" : "${sortOrder}"}], onlyTemplates=[true], limit=[${limit}], offset=[${offset}]);`,
		(response) => (response.length < 15 ? -1 : Infinity),
		(response) => response,
		{
			limit: 15,
		},
		[debouncedSearch, sortValue, sortOrder, JSON.stringify(metaFilters)],
	);

	const { setScroll, resetScroll } = useInfiniteScroll({
		disabled: getTemplates.isLoading || !getTemplates.hasMore,
		onNext: () => getTemplates.next(),
	});

	useEffect(() => {
		const scrollElement = document.querySelector(
			'[data-home-content="true"]',
		) as HTMLDivElement;
		setScroll(scrollElement);

		return () => setScroll(null);
	}, [setScroll]);

	if (getTemplates.isError) {
		return <P>ERROR</P>;
	}

	const navigateApp = (appId: string) => {
		if (appId) {
			navigate(`/app/${appId}/edit`);
		}
	};

	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<CatalogLayout
				title="New App"
				description="Build, organize, and share interactive experiences - from custom code to agent-powered workflows - so your team can turn data into action."
				headerActions={
					<Button
						variant="outline"
						onClick={() => setIsUploadOpen(true)}
					>
						<UploadIcon aria-hidden="true" />
						Upload
					</Button>
				}
				primaryTask={<NewAppChatComposer />}
				searchBar={
					<CatalogSearchBar
						search={search}
						onSearchChange={setSearch}
						placeholder="Search templates"
						sortValue={sortValue}
						sortOrder={sortOrder}
						sortOptions={[
							{ value: "PROJECTNAME", label: "Name" },
							{ value: "DATECREATED", label: "Date Created" },
						]}
						onSortChange={(value, order) => {
							if (sortOrder === order && sortValue === value) {
								return;
							}

							setSortValue(value);
							setSortOrder(order);
							resetScroll();
							getTemplates.reset();
						}}
						showGridStyle={false}
						gridStyle="CARD"
						onGridStyleChange={() => null}
					/>
				}
				filterBox={
					<CatalogFilterBox
						type="CODE"
						filters={metaFilters as Record<string, string[]>}
						onChange={(filters) => {
							setMetaFilters(filters);
							resetScroll();
							getTemplates.reset();
						}}
					/>
				}
			>
				{getTemplates.isLoading && getTemplates.data.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-6">
						<Spinner className="size-4" />
					</div>
				) : null}
				{getTemplates.data.length > 0 ? (
					<CatalogGrid
						variant="CARD"
						columns={3}
						gap={4}
						isLoading={getTemplates.isLoading}
						showLoadingMore={getTemplates.data.length > 0}
					>
						{getTemplates.data.map((template) => (
							<NewAppTemplateCard
								key={template.project_id}
								id={template.project_id}
								name={
									template.project_display_name ||
									template.project_name
								}
								description={template.description || ""}
								image=""
								dateLastEdited={
									template.project_date_created || ""
								}
								tags={
									Array.isArray(template.tag)
										? template.tag
										: template.tag
											? [template.tag]
											: []
								}
								onUseTemplate={() => setCloneTemplate(template)}
							/>
						))}
					</CatalogGrid>
				) : null}
				{!getTemplates.isLoading && getTemplates.data.length === 0 ? (
					<div className="w-full px-2 py-4 text-center">
						<Muted>No results found</Muted>
					</div>
				) : null}
			</CatalogLayout>
			{isUploadOpen ? (
				<UploadProjectDialog
					open={isUploadOpen}
					type="APP"
					handleClose={(appId) => {
						setIsUploadOpen(false);
						navigateApp(appId);
					}}
				/>
			) : null}
			{cloneTemplate ? (
				<CloneProjectDialog
					open
					project={cloneTemplate}
					onClose={(newAppId) => {
						setCloneTemplate(null);
						if (newAppId) {
							navigate(
								`${TYPE_TO_ROUTE[cloneTemplate.project_type]}/${newAppId}/edit`,
							);
						}
					}}
				/>
			) : null}
		</>
	);
});
