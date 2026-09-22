import { useMemo } from "react";
import { usePixel } from "@semoss/sdk/react";
import { pixel } from "@/lib/pixel";
import {
	type SkillOption,
	skillProjectListSchema,
	toSkillOption,
} from "./list-skills";

interface SkillsQuery {
	/** Validated, attachable skill projects. */
	skills: SkillOption[];
	/** Whether the initial catalog is still loading. */
	isLoading: boolean;
	/** A failed read or invalid catalog response. */
	error: Error | null;
	/** Retry the catalog read. */
	refresh: () => void;
}

/** Load skills using the SDK read lifecycle without treating a failed catalog as empty. */
export function useSkills(): SkillsQuery {
	const { data, status, error, refresh } = usePixel<unknown>(
		pixel("MyProjects", { projectType: "SKILL" }),
	);
	const parsed = useMemo(() => {
		if (status !== "SUCCESS") return { skills: [], error: null };
		const result = skillProjectListSchema.safeParse(data);
		if (!result.success) {
			return {
				skills: [],
				error: new Error("SEMOSS returned an invalid skill catalog."),
			};
		}
		return {
			skills: result.data.map(toSkillOption),
			error: null,
		};
	}, [data, status]);

	return {
		skills: parsed.skills,
		isLoading: status === "INITIAL" || status === "LOADING",
		error: error ?? parsed.error,
		refresh,
	};
}
