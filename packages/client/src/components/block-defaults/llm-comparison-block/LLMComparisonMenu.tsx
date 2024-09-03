import { BlockComponent, Variant, VariantModel } from '@/stores';
import { useBlocks, useRootStore } from '@/hooks';
import { styled, ToggleTabsGroup, useNotification } from '@semoss/ui';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SettingsSubMenu } from './SettingsSubMenu';
import { ConfigureSubMenu } from './ConfigureSubMenu';
import {
    TypeLlmComparisonForm,
    TypeLlmConfig,
    TypeVariant,
    TypeVariants,
} from '@/components/workspace';
import { LLMComparisonContext } from '@/contexts';
import {
    LlmComparisonFormDefaultValues,
    modelEngineOutput,
} from './LlmComparison.utility';
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

export const LLMComparisonMenu: BlockComponent = ({ id }) => {
    const notification = useNotification();
    const { monolithStore } = useRootStore();
    const [mode, setMode] = useState<Mode>('configure');
    const [allModels, setAllModels] = useState<TypeLlmConfig[]>([]);

    const { state } = useBlocks();
    console.log('state', toJS(state.blocks));

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

        const stateVariants = toJS(state.variants);
        const selectedVariants = toJS(state.blocks[id])?.data?.variants || {};

        // Accepts a variant from the App's JSON and models it for the Comparison menu's form state.
        const modelVariantLlms = (variant: Variant): TypeLlmConfig[] => {
            const modelledLlms = variant.models.map((model: VariantModel) => {
                const modelMatch = allModels.find(
                    (mod) => mod.value === model.id,
                );

                // TODO: need to handle error handling for if there is no longer a 'match' for a model stored in a user's variant.
                return {
                    ...modelMatch,
                    topP: model.topP,
                    temperature: model.temperature,
                    length: model.length,
                };
            });
            return modelledLlms;
        };

        // Variants other than the default variant to be added to the form's state
        const otherVariants: TypeVariants = {};

        Object.keys(stateVariants).forEach((name: string, idx) => {
            const variant = stateVariants[name];
            const models = modelVariantLlms(variant);
            const isSelected = Object.keys(selectedVariants).includes(name);

            const modelled: TypeVariant = {
                models,
                selected: isSelected,
                sortWeight: selectedVariants[name]?.sortWeight
                    ? selectedVariants[name]?.sortWeight
                    : idx,
            };

            if (name === 'default') {
                setValue('defaultVariant', modelled);
            } else {
                otherVariants[name] = modelled;
            }
        });

        setValue('variants', otherVariants);
    };

    const fetchAllModels = async () => {
        const pixel = `MyEngines(engineTypes=["MODEL"])`;
        const res = await monolithStore.runQuery(pixel);

        const modelled = modelEngineOutput(res.pixelReturn[0].output);
        setAllModels(modelled);
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
                <StyledToggleTabsGroup
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

                {mode === 'configure' && <ConfigureSubMenu />}

                {mode === 'settings' && <SettingsSubMenu />}
            </StyledMenu>
        </LLMComparisonContext.Provider>
    );
};
