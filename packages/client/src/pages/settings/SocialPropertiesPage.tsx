import React, { useEffect, useState, useReducer } from 'react';
import { useForm } from 'react-hook-form';
import {
    Table,
    Form,
    useNotification,
    styled,
    theme,
} from '@semoss/components';

import { useAPI, useRootStore } from '@/hooks';
import { LoadingScreen } from '@/components/ui';
import { Divider, Accordion, Button, TextField, Typography } from '@semoss/ui';
import google from '../../assets/img/google.png';
import ms from '../../assets/img/ms.png';
import dropbox from '../../assets/img/dropbox.png';
import github from '../../assets/img/github.png';
import other from '../../assets/img/other.png';

const SOCIAL = {
    google: {
        name: 'Google',
        image: google,
    },
    ms: {
        name: 'Microsoft',
        image: ms,
    },
    dropbox: {
        name: 'Dropbox',
        image: dropbox,
    },
    github: {
        name: 'Github',
        image: github,
    },
    native: {
        name: 'Native',
        image: other,
    },
};

const StyledImage = styled('img', {
    objectFit: 'cover',
    maxHeight: '28px',
    maxWidth: '28px',
    verticalAlign: 'middle',
    padding: '4px',
});

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

    const [accordionValue, setAccordionValue] = useState<string>();
    const [search, setSearch] = useState<string>('');

    const [authentication, setAuthentication] = useState(
        Object.keys(socialProps),
    );
    const [authExpanded, setAuthExpanded] = useState(false);
    const [emailExpanded, setEmailExpanded] = useState(false);

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
        setAuthentication(Object.keys(formattedProperties));
        // setSocialProps(formattedProperties);
    }, [loginProperties.status, loginProperties.data]);

    useEffect(() => {
        // reset the options if there is no search value
        if (!search) {
            setAuthentication(Object.keys(socialProps));
            return;
        }

        const cleanedSearch = search.toLowerCase();

        const filtered = authentication.filter((c) => {
            return c.toLowerCase().includes(cleanedSearch);
        });

        setAuthentication(filtered);
    }, [search]);

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

    const settingsPage = () => {
        return Object.keys(socialProps) ? (
            <div style={{ display: 'flex' }}>
                <div>
                    <Accordion
                        expanded={authExpanded}
                        onChange={() => setAuthExpanded(!authExpanded)}
                    >
                        <Accordion.Trigger
                            sx={{ padding: '8px', fontSize: '16px' }}
                        >
                            <strong>Authentication</strong>
                        </Accordion.Trigger>
                        {authentication.map((value) => {
                            return (
                                <Accordion.Content sx={{ fontSize: '14px' }}>
                                    <Button
                                        onClick={() => setAccordionValue(value)}
                                    >
                                        <StyledImage
                                            src={
                                                SOCIAL[value]?.image ||
                                                SOCIAL['native'].image
                                            }
                                        />
                                        {SOCIAL[value]?.name ||
                                            value[0].toUpperCase() +
                                                value.slice(1)}
                                    </Button>
                                </Accordion.Content>
                            );
                        })}
                    </Accordion>
                    <Accordion
                        expanded={emailExpanded}
                        onChange={() => setEmailExpanded(!emailExpanded)}
                    >
                        <Accordion.Trigger
                            sx={{ padding: '8px', fontSize: '16px' }}
                        >
                            <strong>Email</strong>
                        </Accordion.Trigger>

                        {authentication.map((value) => {
                            return (
                                <Accordion.Content sx={{ fontSize: '14px' }}>
                                    <StyledImage
                                        src={
                                            SOCIAL[value]?.image ||
                                            SOCIAL['native'].image
                                        }
                                    />
                                    {SOCIAL[value]?.name ||
                                        value[0].toUpperCase() + value.slice(1)}
                                </Accordion.Content>
                            );
                        })}
                    </Accordion>
                </div>
                {accordionValue && (
                    <SocialProperty
                        key={authentication.indexOf(accordionValue)}
                        fieldName={accordionValue}
                        fields={socialProps[accordionValue]}
                        onChange={changeSocialProps}
                    ></SocialProperty>
                )}
            </div>
        ) : (
            <div> No social props</div>
        );
    };

    return (
        <StyledContainer>
            <StyledDescription>
                Use this portal to change social property settings
            </StyledDescription>
            <Divider />
            {settingsPage()}
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
            <div style={{ display: 'flex' }}>
                <Typography variant="h5">
                    {fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}
                </Typography>

                <StyledActionButtonsDiv>
                    <Button
                        // size="sm"
                        // color="grey"
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
                    <Button onClick={() => onSubmit()}>Save</Button>
                </StyledActionButtonsDiv>
            </div>

            {fields.map((f, i) => {
                return (
                    <div>
                        {console.log(f)}
                        <TextField
                            label="key"
                            defaultValue={f.label}
                            variant="outlined"
                        />
                        <TextField label="value" defaultValue={f.value} />
                        <TextField placeholder="Description"></TextField>
                    </div>
                );
            })}
        </Form>
    );
};

{
    /* <Table>
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
</Table> */
}
