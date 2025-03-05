import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { observer } from "mobx-react-lite";

import { runPixel } from "@semoss/sdk";
import { styled, ToggleTabsGroup, useNotification } from "@semoss/ui";

import { LLMComparisonContext } from "./context/LLMComparisonContext";
import { LlmComparisonFormDefaultValues } from "./utility";
import { BlockComponent, Variant } from "../../../store";
import { useBlock, useBlocks } from "../../../hooks";
import {
    TypeLlmConfig,
    TypeLlmComparisonForm,
    TypeVariants,
} from "../../../types";
import { ConfigureSubMenu } from "./settings/ConfigureSubMenu";

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    height: "36px",
    alignItems: "center",
    width: "306px",
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: "32px",
    width: "50%",
}));

const StyledMenu = styled("div")(({ theme }) => ({
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: theme.spacing(1),
    paddingTop: theme.spacing(2),
}));

export const modelEngineOutput = (
    output: {
        database_subtype: string;
        database_type: string;
        database_name: string;
        database_id: string;
        app_name: string;
    }[],
): TypeLlmConfig[] => {
    return output.map((data) => {
        return {
            alias: data.app_name,
            value: data.database_id,
            database_name: data.database_name,
            database_type: data.database_type,
            database_subtype: data.database_subtype,
            topP: 0,
            temperature: 0,
            length: 0,
        };
    });
};

type Mode = "configure" | "settings";

export const LLMComparisonMenu: BlockComponent = observer(({ id }) => {
    const { data } = useBlock(id);
    const { state } = useBlocks();

    const notification = useNotification();

    const [mode, setMode] = useState<Mode>("configure");
    const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);

    const fetchedModelsRef = useRef(false);
    const { control, setValue, handleSubmit, getValues, watch } =
        useForm<TypeLlmComparisonForm>({
            defaultValues: LlmComparisonFormDefaultValues,
        });

    useEffect(() => {
        notification.add({
            color: "info",
            message:
                "The LLM Comparison tool is currently in beta, please contact the administrator with any issues with this part of the tool",
        });
    }, []);

    useEffect(() => {
        initialFetch();
    }, [id]);

    // fetch any relevant data and apply the app's variants to the form's state.
    const initialFetch = async () => {
        const allModels = await fetchAllModels();
        setAllModels(allModels);

        getVariantsFromCell(allModels);
    };

    // // update variants when the user changes the block's query.
    useEffect(() => {
        if (data.queryId && data.cellId && fetchedModelsRef.current) {
            getVariantsFromCell(allModels);
        } else {
            setValue("variants", {});
        }
    }, [data.queryId, data.cellId, allModels]);

    // Retrieve model, and set Variants in state from selected query.
    const getVariantsFromCell = (models) => {
        if (!data.queryId || !data.cellId) return;

        let cell;
        if (
            typeof data.queryId === "string" &&
            typeof data.cellId === "string"
        ) {
            cell = state.getQuery(data.queryId).cells[data.cellId];
        } else {
            console.log("Type of 'data.queryId' is NOT a string");
            return;
        }
        if (!cell) return;

        // Accepts a variant from the App's JSON and models it for the Comparison menu's form state.
        const modelVariantLlm = (variant: Variant): TypeLlmConfig => {
            const modelMatch = models.find(
                (mod) => mod.value === variant.model.id,
            );

            return {
                value: variant.model.id,
                database_name: modelMatch?.database_name || "",
                database_type: modelMatch?.database_type || "",
                database_subtype: modelMatch?.database_subtype || "",
                topP: variant.model.topP,
                temperature: variant.model.temperature,
                length: variant.model.length,
            };
        };

        const variants: TypeVariants = {};
        Object.values(cell.parameters.variants || {}).forEach(
            (variant: Variant) => {
                const model = modelVariantLlm(variant);
                variants[variant.id] = {
                    model,
                    sortWeight: 0, // TODO
                    trafficAllocation: 0,
                };
            },
        );
        setValue("variants", variants);
    };

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await runPixel(pixel);

        const list = res.pixelReturn[0].output as Array<{
            database_subtype: string;
            database_type: string;
            database_name: string;
            database_id: string;
            app_name: string;
        }>;

        const modelled = modelEngineOutput(list);
        setAllModels(modelled);
        fetchedModelsRef.current = true;
        return modelled;
    };

    return (
        <LLMComparisonContext.Provider
            value={{
                blockId: id,
                control,
                setValue,
                getValues,
                handleSubmit,
                watch,
                allModels,
            }}
        >
            <StyledMenu>
                <ConfigureSubMenu />
            </StyledMenu>
        </LLMComparisonContext.Provider>
    );
});
