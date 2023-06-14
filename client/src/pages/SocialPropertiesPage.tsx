import React, { useEffect, useState, useReducer } from 'react';
import { useForm } from 'react-hook-form';
import {
    Accordion,
    Table,
    Button,
    Form,
    useNotification,
    styled,
    theme,
} from '@semoss/components';
import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { Field } from '@/components/form';

const StyledContainer = styled('div', {
    margin: '0 auto',
    paddingLeft: theme.space[8],
    paddingRight: theme.space[8],
    paddingBottom: theme.space[8],
    '@sm': {
        maxWidth: '640px',
    },
    '@md': {
        maxWidth: '768px',
    },
    '@lg': {
        maxWidth: '1024px',
    },
    '@xl': {
        maxWidth: '1280px',
    },
    '@xxl': {
        maxWidth: '1536px',
    },
});

const StyledDescription = styled('div', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.md,
    width: '100%',
    maxWidth: '50%',
    marginBottom: theme.space['6'],
});

const StyledAccordionContent = styled(Accordion.Content, {
    height: 'auto',
    margin: theme.space['2'],
});

const StyledActionButtonsDiv = styled('div', {
    display: 'flex',
    justifyContent: 'center',
    gap: '.5rem',
    marginTop: theme.space['2'],
});

const initialState = {
    socialProps: {},
};

const reducer = (state, action) => {
    switch (action.type) {
        case 'field': {
            return {
                ...state,
                [action.field]: action.value,
            };
        }
    }
    return state;
};

export const SocialPropertiesPage = () => {
    // useStateChange doesn't play well with Accordion
    // const [socialProps, setSocialProps] = useState({});

    const [state, dispatch] = useReducer(reducer, initialState);
    const { socialProps } = state;

    const [accordionValue, setAccordionValue] = useState();

    const loginProperties = useAPI(['getLoginProperties']);

    useEffect(() => {
        // pixel call to get pending members
        if (loginProperties.status !== 'SUCCESS' || !loginProperties.data) {
            return;
        }

        // Key is the label for each accordion, the value is an array of fields
        const formattedProperties = {};
        Object.entries(loginProperties.data).map((pr) => {
            if (pr[0] === 'cac') return; // angular js ui doesn't paint cac
            const fields = [];
            Object.entries(pr[1]).map((prop) => {
                const fieldMap = {
                    label: prop[0],
                    value: prop[1],
                };

                fields.push(fieldMap);
            });

            if (!formattedProperties[pr[0]]) {
                formattedProperties[pr[0]] = fields;
            }
        });

        dispatch({
            type: 'field',
            field: 'socialProps',
            value: formattedProperties,
        });
        // setSocialProps(formattedProperties);
    }, [loginProperties.status, loginProperties.data]);

    // show a loading screen when loginProperties is pending
    if (loginProperties.status !== 'SUCCESS' || !Object.keys(socialProps)) {
        return (
            <LoadingScreen.Trigger description="Retrieving social properties" />
        );
    }

    const changeSocialProps = (fieldName, value) => {
        const socialPropsCopy = socialProps;
        socialPropsCopy[fieldName] = value;

        dispatch({
            type: 'field',
            field: 'socialProps',
            value: socialPropsCopy,
        });
        // setSocialProps(socialPropsCopy);
    };

    return (
        <StyledContainer>
            <StyledDescription>
                Use this portal to change social property settings
            </StyledDescription>
            {Object.keys(socialProps) ? (
                <Accordion multiple={false} value={accordionValue}>
                    {Object.entries(socialProps).map((pr, i) => {
                        return (
                            <Accordion.Item key={i} value={pr[0]}>
                                <Accordion.Trigger>
                                    {pr[0].charAt(0).toUpperCase() +
                                        pr[0].slice(1)}
                                </Accordion.Trigger>
                                <StyledAccordionContent>
                                    <SocialProperty
                                        key={i}
                                        fieldName={pr[0]}
                                        fields={pr[1]}
                                        onChange={changeSocialProps}
                                    ></SocialProperty>
                                </StyledAccordionContent>
                            </Accordion.Item>
                        );
                    })}
                </Accordion>
            ) : (
                <div> No social props</div>
            )}
        </StyledContainer>
    );
};

const mapDefaultValues = (vals) => {
    const value: any = {};

    vals.map((f: FieldProps) => {
        if (!value[f.label]) {
            value[f.label] = f.value;
        }
    });

    return value;
};
interface FieldProps {
    label: string;
    value: string;
}

interface PropertyProps {
    fieldName: string;
    fields: FieldProps[];
    onChange: (string, FieldProps) => void;
}

const SocialProperty = (props) => {
    const { fieldName, fields, onChange } = props;

    const { monolithStore } = useRootStore();
    const notification = useNotification();

    // used for reset
    const [defaultValues, setDefaultValues] = useState<FieldProps[]>();

    const { control, handleSubmit, reset } = useForm({
        defaultValues: mapDefaultValues(fields),
    });

    /**
     * @name onSubmit
     * @desc changes properties based on updates to social props
     * @param data - form data
     */
    const onSubmit = handleSubmit((data) => {
        monolithStore
            .modifyLoginProperties(fieldName, data)
            .then((response) => {
                notification.add({
                    color: 'success',
                    content: `Succesfully modified ${fieldName} properties`,
                });

                const valueCopy = [];
                // structure values to pass to parent and defaultValues
                Object.entries(data).map((k, v) => {
                    const objCopy = {
                        label: k[0],
                        value: k[1],
                    };
                    valueCopy.push(objCopy);
                });

                // pass to the parent that holds state of all properties
                onChange(fieldName, valueCopy);

                // set new default values for reset
                setDefaultValues(valueCopy);
            });
    });

    return (
        <Form>
            <Table>
                <Table.Head>
                    <Table.Row>
                        <Table.Cell colSpan={1}>Property</Table.Cell>
                        <Table.Cell colSpan={1}>
                            {fieldName.charAt(0).toUpperCase() +
                                fieldName.slice(1)}{' '}
                            Value
                        </Table.Cell>
                    </Table.Row>
                </Table.Head>
                <Table.Body>
                    {fields.map((f, i) => {
                        return (
                            <Table.Row key={i}>
                                <Table.Cell colSpan={1}>{f.label}</Table.Cell>
                                <Table.Cell colSpan={1}>
                                    <Field
                                        name={f.label}
                                        control={control}
                                        rules={{ required: true }}
                                        options={{
                                            component: 'input',
                                        }}
                                        error="All properties must be provided with a value"
                                        description=""
                                    ></Field>
                                </Table.Cell>
                            </Table.Row>
                        );
                    })}
                </Table.Body>
            </Table>
            <StyledActionButtonsDiv>
                <Button
                    size="sm"
                    color="grey"
                    onClick={() => {
                        if (!defaultValues) {
                            reset();
                        } else {
                            reset(mapDefaultValues(defaultValues));
                        }
                    }}
                >
                    Reset
                </Button>
                <Button size="sm" onClick={() => onSubmit()}>
                    Save
                </Button>
            </StyledActionButtonsDiv>
        </Form>
    );
};
