import { BlockComponent, CellState, Variant } from '@/stores';
import { useBlock, useBlocks, useRootStore } from '@/hooks';
import { styled, ToggleTabsGroup, useNotification } from '@semoss/ui';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';
import {
    TypeLlmComparisonForm,
    TypeLlmConfig,
    TypeVariants,
} from '@/components/workspace';
import { LLMComparisonContext } from '@/contexts';
import {
    LlmComparisonFormDefaultValues,
    modelEngineOutput,
} from './LlmComparison.utility';
import { observer } from 'mobx-react-lite';
import { toJS } from 'mobx';

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    height: '36px',
    alignItems: 'center',
    width: '306px',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '32px',
    width: '50%',
}));

const StyledMenu = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingTop: theme.spacing(2),
}));

type Mode = 'configure' | 'settings';

export const LLMComparisonMenu: BlockComponent = observer(({ id }) => {
    const fetchedModelsRef = useRef(false);
    const { data } = useBlock(id);
    const { state } = useBlocks();
    const notification = useNotification();
    const { monolithStore } = useRootStore();
    const [mode, setMode] = useState<Mode>('configure');
    const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);

    const { control, setValue, handleSubmit, getValues, watch } =
        useForm<TypeLlmComparisonForm>({
            defaultValues: LlmComparisonFormDefaultValues,
        });

    useEffect(() => {
        notification.add({
            color: 'info',
            message:
                'The LLM Comparison tool is currently in beta, please contact the administrator with any issues with this part of the tool',
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

    // update variants when the user changes the block's query.
    useEffect(() => {
        if (data.variableId && fetchedModelsRef.current) {
            getVariantsFromCell(allModels);
        } else {
            setValue('variants', {});
        }
    }, [data.variableId, allModels]);

    const getVariantsFromCell = (models) => {
        // Find the Block's assigned cell and set its variants in state.
        let cell: CellState | null = null;
        if (!data.variableId) {
            return;
        } else if (typeof data.variableId === 'string') {
            const variable = state.variables[data.variableId];
            if (!variable || variable.type !== 'cell') {
                console.log(
                    `Error retrieving variable with ID: ${data.variableId}`,
                );
            } else {
                const query = state.getQuery(variable.to);
                cell = query.getCell(variable.cellId) || null;
            }
        }
        if (!cell) return;

        // Accepts a variant from the App's JSON and models it for the Comparison menu's form state.
        const modelVariantLlm = (variant: Variant): TypeLlmConfig => {
            const modelMatch = models.find(
                (mod) => mod.value === variant.model.id,
            );

            return {
                value: variant.model.id,
                database_name: modelMatch?.database_name || '',
                database_type: modelMatch?.database_type || '',
                database_subtype: modelMatch?.database_subtype || '',
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
        setValue('variants', variants);
    };

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);
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
                {/* <StyledToggleTabsGroup
                    value={mode}
                    onChange={(e, val) => setMode(val as Mode)}
                >
                    <StyledToggleTabsGroupItem
                        label="Configure"
                        value="configure"
                    />
                    <StyledToggleTabsGroupItem
                        label="Settings"
                        value="settings"
                    />
                </StyledToggleTabsGroup>

                {mode === 'configure' && <ConfigureSubMenu blockId={id} />}

                {mode === 'settings' && <SettingsSubMenu />} */}

                <ConfigureSubMenu />
            </StyledMenu>
        </LLMComparisonContext.Provider>
    );
});
