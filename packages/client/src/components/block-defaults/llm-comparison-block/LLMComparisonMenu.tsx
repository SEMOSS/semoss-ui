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

        initialFetch();
    }, []);

    // fetch any relevant data and apply the app's variants to the form's state.
    const initialFetch = async () => {
        const allModels = await fetchAllModels();

        const stateVariants = toJS(state.variants);

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
        const otherVariants = [];

        Object.keys(stateVariants).forEach((name: string) => {
            if (name === 'default') {
                const defaultVar = stateVariants[name];
                const models = modelVariantLlms(defaultVar);

                const modelled: TypeVariant = {
                    name,
                    models,
                    selected: true,
                };
                setValue('defaultVariant', modelled);
            } else {
                const otherVar = stateVariants[name];
                const models = modelVariantLlms(otherVar);

                const modelled: TypeVariant = {
                    name,
                    models,
                    selected: false,
                };
                otherVariants.push(modelled);
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
