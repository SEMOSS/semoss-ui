import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";

const formatNum = (val: string): string => {
	const digits = val.replace(/[^0-9]/g, "");
	if (!digits) return "";
	return Number(digits).toLocaleString();
};

const parseNum = (val: string): string => val.replace(/[^0-9]/g, "");

export interface ModelRestrictionFieldsProps {
	restriction: string;
	setRestriction: (value: string) => void;
	maxTokens: string;
	setMaxTokens: (value: string) => void;
	maxTime: string;
	setMaxTime: (value: string) => void;
	frequency: string;
	setFrequency: (value: string) => void;
}

export const ModelRestrictionFields = ({
	restriction,
	setRestriction,
	maxTokens,
	setMaxTokens,
	maxTime,
	setMaxTime,
	frequency,
	setFrequency,
}: ModelRestrictionFieldsProps) => {
	const { t } = useTranslation("members");
	const [open, setOpen] = useState(true);

	return (
		<Collapsible
			open={open}
			onOpenChange={setOpen}
			className="flex flex-col gap-3 rounded border border-border p-3"
		>
			<CollapsibleTrigger asChild>
				<button
					type="button"
					className="flex items-center gap-1.5 text-start font-medium text-sm"
				>
					{open ? (
						<ChevronDown className="h-4 w-4 shrink-0" />
					) : (
						<ChevronRight className="rtl:-scale-x-100 h-4 w-4 shrink-0" />
					)}
					{t("restrictions.title")}
				</button>
			</CollapsibleTrigger>
			<CollapsibleContent className="flex flex-col gap-3">
				<div className="flex flex-col gap-1.5">
					<Label>{t("restrictions.usageLimitType")}</Label>
					<Select
						value={restriction}
						onValueChange={(val) => {
							setRestriction(val);
							setMaxTokens("");
							setMaxTime("");
						}}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="null">
								{t("restrictions.none")}
							</SelectItem>
							<SelectItem value="token">
								{t("restrictions.token")}
							</SelectItem>
							<SelectItem value="compute">
								{t("restrictions.computeTime")}
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				{restriction === "token" && (
					<div className="flex flex-col gap-1.5">
						<Label>{t("restrictions.maxTokens")}</Label>
						<Input
							type="text"
							inputMode="numeric"
							value={formatNum(maxTokens)}
							onChange={(e) =>
								setMaxTokens(parseNum(e.target.value))
							}
						/>
					</div>
				)}
				{restriction === "compute" && (
					<div className="flex gap-3">
						<div className="flex flex-1 flex-col gap-1.5">
							<Label>{t("restrictions.maxResponseTime")}</Label>
							<Input
								type="text"
								inputMode="numeric"
								value={formatNum(maxTime)}
								onChange={(e) =>
									setMaxTime(parseNum(e.target.value))
								}
							/>
						</div>
						<div className="flex w-36 flex-col gap-1.5">
							<Label>{t("restrictions.unit")}</Label>
							<Input
								value={t("restrictions.milliseconds")}
								readOnly
							/>
						</div>
					</div>
				)}
				{restriction !== "null" && (
					<div className="flex flex-col gap-1.5">
						<Label>{t("restrictions.frequency")}</Label>
						<Select value={frequency} onValueChange={setFrequency}>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="DAY">
									{t("restrictions.daily")}
								</SelectItem>
								<SelectItem value="WEEK">
									{t("restrictions.weekly")}
								</SelectItem>
								<SelectItem value="MONTH">
									{t("restrictions.monthly")}
								</SelectItem>
								<SelectItem value="YEAR">
									{t("restrictions.yearly")}
								</SelectItem>
								<SelectItem value="ALL_TIME">
									{t("restrictions.allTime")}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}
			</CollapsibleContent>
		</Collapsible>
	);
};
