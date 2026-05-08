import { DicesIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Button,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	Input,
} from "@semoss/ui/next";
import { RoomOptionsImageSelect } from "@/components/room/room-options-image-select";
import type { ImageSize, ImageType } from "@/constants";
import { IMAGE_SIZE_PRESETS, MAX_SEED } from "@/constants";
import type { RoomStore } from "@/stores";

interface RoomOptionsImageProps {
	options: RoomStore["options"];
	onOptionsChange: (options: Partial<RoomStore["options"]>) => void;
}

const deriveImagePreset = (
	imageHeight: number,
	imageWidth: number,
): { size: ImageSize; type: ImageType } => {
	for (const [size, types] of Object.entries(IMAGE_SIZE_PRESETS)) {
		for (const [type, dims] of Object.entries(types)) {
			if (dims.height === imageHeight && dims.width === imageWidth) {
				return {
					size: size as ImageSize,
					type: type as ImageType,
				};
			}
		}
	}
	return { size: "large", type: "square" };
};

export const RoomOptionsImage: React.FC<RoomOptionsImageProps> = ({
	options,
	onOptionsChange,
}) => {
	const { t } = useTranslation(["room", "common"]);

	const { size: imageSize, type: imageType } = deriveImagePreset(
		options.imageHeight,
		options.imageWidth,
	);

	const [seedInput, setSeedInput] = useState<string>(
		options.seed?.toString() ?? "",
	);
	const seedNum = seedInput === "" ? undefined : Number(seedInput);
	const isSeedInvalid = seedNum !== undefined && seedNum > MAX_SEED;

	const handleImagePresetChange = (size: ImageSize, type: ImageType) => {
		const preset = IMAGE_SIZE_PRESETS[size][type];
		onOptionsChange({
			imageHeight: preset.height,
			imageWidth: preset.width,
		});
	};

	return (
		<>
			<FieldSeparator />
			<FieldSet>
				<FieldLegend>{t("common:labels.imageGenHeader")}</FieldLegend>
				<FieldDescription>
					{t("room:settings.imageGenDescription")}
				</FieldDescription>
				<FieldGroup>
					<Field>
						<FieldLabel>
							{t("room:form.imageOrientationLabel")}
						</FieldLabel>
						<RoomOptionsImageSelect
							value={imageType}
							onChange={(v) => {
								handleImagePresetChange(
									imageSize,
									v as typeof imageType,
								);
							}}
							options={[
								{
									value: "square",
									label: t("room:form.imageTypeSquareLabel"),
									svgTitle: "Square Orientation",
									svgContent: (
										<rect
											x="6"
											y="6"
											width="28"
											height="28"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "portrait",
									label: t(
										"room:form.imageTypePortraitLabel",
									),
									svgTitle: "Portrait Orientation",
									svgContent: (
										<rect
											x="12"
											y="4"
											width="16"
											height="32"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "landscape",
									label: t(
										"room:form.imageTypeLandscapeLabel",
									),
									svgTitle: "Landscape Orientation",
									svgContent: (
										<rect
											x="4"
											y="12"
											width="32"
											height="16"
											rx="2"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
							]}
						/>
					</Field>
					<Field>
						<FieldLabel>{t("room:form.imageSizeLabel")}</FieldLabel>
						<RoomOptionsImageSelect
							value={imageSize}
							onChange={(v) => {
								handleImagePresetChange(
									v as typeof imageSize,
									imageType,
								);
							}}
							options={[
								{
									value: "small",
									label: t("room:form.imageSizeSmallLabel"),
									svgTitle: "Small size",
									svgContent: (
										<rect
											x="14"
											y="14"
											width="12"
											height="12"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "medium",
									label: t("room:form.imageSizeMediumLabel"),
									svgTitle: "Medium size",
									svgContent: (
										<rect
											x="9"
											y="9"
											width="22"
											height="22"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
								{
									value: "large",
									label: t("room:form.imageSizeLargeLabel"),
									svgTitle: "Large size",
									svgContent: (
										<rect
											x="4"
											y="4"
											width="32"
											height="32"
											rx="1.5"
											fill="none"
											stroke="currentColor"
											strokeWidth="1.5"
											strokeDasharray="3 2"
										/>
									),
								},
							]}
						/>
					</Field>
					<Field>
						<FieldLabel>{t("room:form.imageSeedLabel")}</FieldLabel>
						<div className="flex gap-2">
							<Input
								type="text"
								inputMode="numeric"
								pattern="[0-9]*"
								placeholder="1"
								value={seedInput}
								onChange={(e) => {
									const raw = e.target.value.replace(
										/\D/g,
										"",
									);
									setSeedInput(raw);
									const num =
										raw === "" ? undefined : Number(raw);
									if (num === undefined || num <= MAX_SEED) {
										onOptionsChange({ seed: num });
									}
								}}
								className={[
									"w-full",
									isSeedInvalid
										? "border-destructive focus-visible:ring-destructive"
										: "",
								].join(" ")}
							/>
							<Button
								variant="outline"
								size="icon"
								type="button"
								onClick={() => {
									const newSeed =
										Math.floor(Math.random() * MAX_SEED) +
										1;
									setSeedInput(newSeed.toString());
									onOptionsChange({ seed: newSeed });
								}}
							>
								<DicesIcon />
							</Button>
						</div>
						{isSeedInvalid && (
							<p className="mt-1 text-destructive text-xs">
								Cannot input a number higher than{" "}
								{MAX_SEED.toLocaleString()}
							</p>
						)}
					</Field>
				</FieldGroup>
			</FieldSet>
		</>
	);
};
