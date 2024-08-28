import { styled, Stack, Button, useNotification } from '@semoss/ui';
import { useEffect, useRef } from 'react';
import { useBlocks, useLLMComparison } from '@/hooks';
import { LLMVariant } from './LLMVariant';
// import { TypeLlmComparisonForm, TypeLlmConfig } from '@/components/workspace';
import { LLMEditor } from './LLMEditor';
import { ArrowBack } from '@mui/icons-material';
import { ActionMessages } from '@/stores';

const StyledEditorView = styled(Stack)(({ theme }) => ({
    width: '100%',
}));

const StyledAllView = styled(Stack)(({ theme }) => ({
    width: '100%',
    padding: theme.spacing(2),
}));

const StyledActionBar = styled('div')(({ theme }) => ({
    display: 'flex',
    gap: theme.spacing(2),
    padding: `0 ${theme.spacing(2)}`,
}));

const new_variant = {
    to: 'unformatted', // points to a variable that is an llm cell
    models: [
        {
            alias: '',
            value: 'variant 2 model 1',
            database_id: 'dbf6d2d7-dfba-4400-a214-6ac403350b04',
            database_name: 'CFG AI GPT3.5 Turbo',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '25',
                temperature: '6',
                length: '88',
            },
        },
        {
            alias: '',
            value: 'variant 2 model 3',
            database_id: '001510f8-b86e-492e-a7f0-41299775e7d9',
            database_name: 'AIC LLM',
            database_type: '',
            database_subtype: '',
            topP: '',
            temperature: '',
            length: '',
            paramValues: {
                topP: '3',
                temperature: '1',
                length: '2',
            },
        },
    ],
};

export const LLMVariantConfigure = (props) => {
    const { defaultVariant } = props;
    const viewRef = useRef('allVariants');
    const notification = useNotification();

    const { state } = useBlocks();

    console.log('default variant', defaultVariant);
    // const { allModels, setValue, watch, handleSubmit, getValues } =
    //     useLLMComparison();
    // const defaultVariant = watch('defaultVariant');
    // const variants = watch('variants');
    // const designerView = watch('designerView');
    // const modelsToEdit = watch('modelsToEdit');

    // useEffect(() => {
    //     if (designerView !== viewRef.current) {
    //         viewRef.current = designerView;
    // const editorVariant = getValues('editorVariant');
    // const editorModel = getValues('editorModel');

    // if (designerView === 'allVariants') {
    //     setValue('modelsToEdit', []);
    // } else if (designerView === 'variantEdit') {
    //     setValue('modelsToEdit', editorVariant.models);
    // } else if (designerView === 'modelEdit') {
    //     setValue('modelsToEdit', [editorModel]);
    // }
    //     }
    // }, [designerView]);

    // const onSubmit = (data:
    // TypeLlmComparisonForm
    // ) => {
    // const { modelsToEdit, editorVariantIndex, editorModelIndex } = data;

    // const selectedModels = modelsToEdit.map((model) => {
    // const match = allModels.find((mod) => mod.value === model.value);
    // return {
    //     ...match,
    //     topP: model.topP || 0,
    //     temperature: model.temperature || 0,
    //     length: model.length || 0,
    // };
    // });

    // if (designerView === 'variantEdit') {
    // setValue('variants', [
    //     ...variants.slice(0, editorVariantIndex + 1),
    //     {
    //         name: 'new',
    //         selected: true,
    //         models: selectedModels,
    //     },
    //     ...variants.slice(editorVariantIndex + 1),
    // ]);
    //     clearEditor('variant');
    // } else if (designerView === 'modelEdit') {
    //     // TODO
    //     clearEditor('model');
    // }

    // setValue('designerView', 'allVariants');
    // };

    const onError = (errors) => {
        notification.add({
            color: 'error',
            message: 'Fix the errors before saving.',
        });
    };

    const clearEditor = (type: 'model' | 'variant') => {
        if (type === 'variant') {
            // setValue('editorVariantIndex', null);
            // setValue('editorVariant', null);
            // setValue('modelsToEdit', []);
        } else {
            // setValue('editorVariantIndex', null);
            // setValue('editorModelIndex', null);
            // setValue('editorModel', null);
            // setValue('modelsToEdit', []);
        }
    };

    const handleResetParams = () => {
        // const editorVariant = getValues('editorVariant');
        // const editorModel = getValues('editorModel');
        // if (designerView === 'variantEdit') {
        //     setValue('modelsToEdit', editorVariant.models);
        // } else if (designerView === 'modelEdit') {
        //     setValue('modelsToEdit', [editorModel]);
        // }
    };

    const setVariant = () => {
        console.log('variant for llm-cell: ', new_variant);

        debugger;
        state.dispatch({
            message: ActionMessages.ADD_VARIANT,
            payload: {
                id: new_variant.to,
                json: new_variant,
            },
        });
    };

    return (
        <StyledAllView direction="column" gap={2}>
            {/* <LLMVariant isDefault={true} variant={defaultVariant} index={-1} /> */}

            <Button
                onClick={() => {
                    setVariant();
                }}
            >
                Set Variant
            </Button>
        </StyledAllView>
    );

    // if (designerView === 'allVariants') {
    //     return (
    //         <StyledAllView direction="column" gap={2}>
    //             <ModelVariant
    //                 isDefault={true}
    //                 variant={defaultVariant}
    //                 index={-1}
    //             />

    //             {variants.map((variant, idx: number) => (
    //                 <ModelVariant
    //                     variant={variant}
    //                     index={idx}
    //                     key={`variant-${idx}`}
    //                 />
    //             ))}
    //         </StyledAllView>
    //     );
    // } else {
    //     return (
    //         <StyledEditorView direction="column" gap={1}>
    //             <div>
    //                 <StyledActionBar>
    //                     <Button
    //                         variant="text"
    //                         color="secondary"
    //                         startIcon={<ArrowBack />}
    //                         onClick={() => {
    //                             clearEditor(
    //                                 designerView === 'variantEdit'
    //                                     ? 'variant'
    //                                     : 'model',
    //                             );
    //                             setValue('designerView', 'allVariants');
    //                         }}
    //                     >
    //                         Configure
    //                     </Button>
    //                 </StyledActionBar>

    //                 {modelsToEdit.map((model: TypeLlmConfig, idx: number) => (
    //                     <LLMEditor
    //                         key={`LLM-${model.value}-${idx}`}
    //                         model={model}
    //                         index={idx}
    //                     />
    //                 ))}
    //             </div>

    //             <StyledActionBar>
    //                 <Button
    //                     color="primary"
    //                     variant="contained"
    //                     onClick={handleSubmit(onSubmit, onError)}
    //                 >
    //                     Save
    //                 </Button>
    //                 <Button
    //                     color="secondary"
    //                     variant="text"
    //                     onClick={handleResetParams}
    //                 >
    //                     Reset Parameters
    //                 </Button>
    //             </StyledActionBar>
    //         </StyledEditorView>
    //     );
    // }
};
