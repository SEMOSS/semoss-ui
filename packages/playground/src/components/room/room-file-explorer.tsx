import { observer } from "mobx-react-lite";
import { download, useInsight } from "@semoss/sdk/react";
import {
	FileExplorer,
	FileExplorerItem,
	type FlexLayout,
} from "@semoss/shared";
import type { RoomStore } from "@/stores";

interface RoomFileExplorerProps {
	/** Layout */
	layout: FlexLayout.Layout | null;

	/** Room */
	room: RoomStore;
}

export const RoomFileExplorer: React.FC<RoomFileExplorerProps> = observer(
	({ layout, room }) => {
		const insight = useInsight();

		return (
			<FileExplorer
				mode={{
					type: "INSIGHT",
				}}
				ItemComponent={({
					item,
					refresh,
					onItemSelect,
					...otherProps
				}) => {
					return (
						<FileExplorerItem
							draggable={item.type !== "directory"}
							item={item}
							refresh={refresh}
							onItemSelect={(item) => {
								// trigger the default
								onItemSelect(item);

								// don't open directories
								if (item.type === "directory") {
									return;
								}

								// this will select if there or open if not
								room.addSidebarNode(`FILE--${item.path}`, {
									type: "tab",
									name: item.name,
									component: "room-file-editor",
									config: {
										name: item.name,
										path: item.path,
									},
									enableClose: true,
								});
							}}
							onDragStart={(e) => {
								// cannot drag directories
								if (item.type === "directory") {
									return;
								}

								// add to layout
								layout.addTabWithDragAndDrop(
									e as unknown as DragEvent,
									{
										type: "tab",
										name: item.name,
										component: "room-file-editor",
										config: {
											name: item.name,
											path: item.path,
										},
										enableClose: true,
									},
								);
							}}
							secondaryActions={[
								{
									name: "Copy Path",
									action: async (item) => {
										try {
											await navigator.clipboard.writeText(
												item.path,
											);
										} catch (_e) {
											throw new Error(
												"Failed to copy to clipboard",
											);
										}
									},
								},
								item.type !== "directory"
									? {
											name: "Download",
											action: async (item) => {
												// save it
												const { pixelReturn } =
													await insight.actions.run<
														[string]
													>(
														`DownloadInsightAsset(filePath=["${item.path}"]);`,
													);

												// get the file key
												const fileKey =
													pixelReturn[0].output;

												// download the file
												await download(
													insight.insightId,
													fileKey,
												);

												refresh();
											},
										}
									: null,
								{
									name: "Delete",
									action: async (item) => {
										await insight.actions.run(
											`DeleteInsightAssets(filePath=["${item.path}"]);`,
										);

										refresh();
									},
								},
							]}
							{...otherProps}
						/>
					);
				}}
			/>
		);
	},
);
