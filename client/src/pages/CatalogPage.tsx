import { useEffect, useState } from 'react';
import {
    styled,
    Input,
    Button,
    Icon,
    Grid,
    Checklist,
} from '@semoss/components';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import { theme } from '@/theme';
import { Page } from '@/components/ui';
import { DatabaseCard } from '@/components/database';
import { usePixel, useRootStore } from '@/hooks';

const TabContainer = styled('div', {
    fontSize: '1rem',
    height: '2em',
    display: 'flex',
    width: '50%',
    justifyContent: 'space-between',
    marginLeft: 15,
});

const StyledTitleGroup = styled('div', {
    display: 'flex',
    alignItems: 'center',
    gap: theme.space['4'],
});

const StyledTitle = styled('h1', {
    color: theme.colors['grey-1'],
    fontSize: theme.fontSizes.xxl,
    fontWeight: theme.fontWeights.semibold,
});

const StyledCatalog = styled('div', {
    display: 'flex',
    gap: theme.space['4'],
});

const StyledMenu = styled('div', {
    flexShrink: '0',
    width: theme.space['72'],
});

const StyledControl = styled('div', {
    position: 'sticky',
    top: '80px',
    width: '100%',
});

const StyledControlHeader = styled('div', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
});

const StyledControlTitle = styled('h5', {
    color: theme.colors['grey-2'],
    fontSize: theme.fontSizes.sm,
    fontWeight: theme.fontWeights.semibold,
    textTransform: 'uppercase',
});

const StyledSearch = styled(Input, {
    marginBottom: theme.space['4'],
});

const StyledFilter = styled('ul', {
    width: '100%',
    borderRadius: theme.radii.default,
    backgroundColor: theme.colors.base,
    borderWidth: theme.borderWidths.default,
    borderColor: theme.colors['grey-4'],
});
const DataCatalogTitleWrapper = styled('div', {
    width: theme.space['72'],
});

const StyledFilterItem = styled('li', {
    paddingLeft: theme.space['4'],
    paddingRight: theme.space['4'],
    paddingTop: theme.space['2'],
    paddingBottom: theme.space['2'],
    borderBottomWidth: theme.borderWidths.default,
    borderBottomColor: theme.colors['grey-4'],
    cursor: 'pointer',
    '&:last-child': {
        borderBottom: 'none',
    },
    variants: {
        open: {
            true: {
                backgroundColor: theme.colors['primary-5'],
            },
            false: {
                '&:hover': {
                    backgroundColor: theme.colors['primary-5'],
                },
            },
        },
    },
});

const StyledFilterTitle = styled('span', {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: theme.fontSizes.sm,
});

const StyledFilterIcon = styled(Icon, {
    fill: theme.colors['primary-1'],
});

const StyledFilterOpen = styled('div', {
    paddingTop: theme.space['4'],
    paddingLeft: theme.space['4'],
});

const StyledLink = styled(Link, {
    display: 'inline-block',
    width: '100%',
});

const StyledGrid = styled(Grid, {
    flex: 1,
    overflow: 'hidden',
});

const ButtonWrapper = styled('div', {
    // width: theme.space['72'],
    width: '85%',
    display: 'flex',
    justifyContent: 'space-between',
});

/**
 * Catalog landing Page
 * Landing page to view the available datasets and search through it
 */
export const CatalogPage = observer((): JSX.Element => {
    const { configStore } = useRootStore();

    // get a list of the keys
    const databaseMetaKeys = configStore.store.config.databaseMetaKeys.filter(
        (k) => {
            return (
                k.display_options === 'single-checklist' ||
                k.display_options === 'multi-checklist' ||
                k.display_options === 'single-select' ||
                k.display_options === 'multi-select' ||
                k.display_options === 'single-typeahead' ||
                k.display_options === 'multi-typeahead'
            );
        },
    );

    // get metakeys to the ones we want
    const metaKeys = databaseMetaKeys.map((k) => {
        return k.metakey;
    });

    // save the search string
    const [search, setSearch] = useState<string>('');

    // which view we are on
    const [view, setView] = useState<string>('My Databases');

    const dbPixelPrefix: string =
        view === 'My Databases' ? `MyDatabases` : 'MyDiscoverableDatabases';

    // track the options
    const [filterOptions, setFilterOptions] = useState<
        Record<string, { value: string; count: number }[]>
    >({});

    // track which filters are opened / closed
    const [filterVisibility, setFilterVisibility] = useState<
        Record<string, boolean>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            prev[current.metakey] = true;

            return prev;
        }, {});
    });
    // track the filter values
    const [filterValues, setFilterValues] = useState<
        Record<string, string[] | string | null>
    >(() => {
        return databaseMetaKeys.reduce((prev, current) => {
            const multiple =
                current.display_options === 'multi-checklist' ||
                current.display_options === 'multi-select' ||
                current.display_options === 'multi-typeahead';

            prev[current.metakey] = multiple ? [] : null;

            return prev;
        }, {});
    });

    const buttons = ['My Databases', 'Community Databases'];
    const tagColors = [
        'blue',
        'orange',
        'teal',
        'purple',
        'yellow',
        'pink',
        'violet',
        'olive',
    ];

    const metaFilters = {};
    for (const key in filterValues) {
        const filter = filterValues[key];
        if (filter && filter.length > 0) {
            metaFilters[key] = filter;
        }
    }

    const getDatabases = usePixel<
        {
            app_cost: string;
            app_id: string;
            app_name: string;
            app_type: string;
            database_cost: string;
            database_global: boolean;
            database_id: string;
            database_name: string;
            database_type: string;
            description: string;
            low_database_name: string;
            permission: number;
            tag: string;
            user_permission: number;
        }[]
    >(
        `${dbPixelPrefix}( metaKeys = ${JSON.stringify(
            metaKeys,
        )} , metaFilters = [ ${JSON.stringify(
            metaFilters,
        )} ] , filterWord=["${search}"]) ;`,
    );

    const getCatalogFilters = usePixel<
        {
            METAKEY: string;
            METAVALUE: string;
            count: number;
        }[]
    >(
        metaKeys.length > 0
            ? `GetDatabaseMetaValues ( metaKeys = ${JSON.stringify(
                  metaKeys,
              )} ) ;`
            : '',
    );

    const setFieldOptionColor = (opt: string): string => {
        return tagColors[
            opt
                .split('')
                .map((x) => x.charCodeAt(0))
                .reduce((a, b) => a + b) % 8
        ];
    };
    useEffect(() => {
        if (getCatalogFilters.status !== 'SUCCESS') {
            return;
        }

        // format the catalog data into a map
        const updated = getCatalogFilters.data.reduce((prev, current) => {
            if (!prev[current.METAKEY]) {
                prev[current.METAKEY] = [];
            }

            prev[current.METAKEY].push({
                value: current.METAVALUE,
                count: current.count,
                color: setFieldOptionColor(current.METAVALUE),
            });
            // setFieldOptionColor(output[i].METAVALUE, output[i].METAKEY)
            return prev;
        }, {});

        setFilterOptions(updated);
    }, [getCatalogFilters.status, getCatalogFilters.data]);

    // finish loading the page
    if (
        getDatabases.status === 'ERROR' ||
        getCatalogFilters.status === 'ERROR'
    ) {
        return <>ERROR</>;
    }

    return (
        <Page
            header={
                <StyledTitleGroup>
                    <DataCatalogTitleWrapper>
                        <StyledTitle>Data Catalog</StyledTitle>
                    </DataCatalogTitleWrapper>
                    <ButtonWrapper>
                        <TabContainer>
                            {buttons.map((button, idx) => {
                                return (
                                    <Button
                                        style={{ width: 168 }}
                                        key={idx}
                                        onClick={() => setView(buttons[idx])}
                                    >
                                        {button}
                                    </Button>
                                );
                            })}
                        </TabContainer>
                        <div>
                            <Link to={'/import'}>
                                <Button
                                    prepend={
                                        <Icon
                                            path={
                                                'M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z'
                                            }
                                        ></Icon>
                                    }
                                >
                                    New Database
                                </Button>
                            </Link>
                        </div>
                    </ButtonWrapper>
                </StyledTitleGroup>
            }
        >
            <StyledCatalog>
                <StyledMenu>
                    {getCatalogFilters.status === 'SUCCESS' ? (
                        <StyledControl>
                            <StyledControlHeader>
                                <StyledControlTitle>Search</StyledControlTitle>
                            </StyledControlHeader>
                            <StyledSearch
                                size="lg"
                                value={search}
                                onChange={(s: string) => {
                                    setSearch(s);
                                }}
                            />
                            <StyledControlHeader>
                                <StyledControlTitle>Filter</StyledControlTitle>
                            </StyledControlHeader>
                            <StyledFilter>
                                {databaseMetaKeys.map((key) => {
                                    const { metakey, display_options } = key;

                                    // don't show if there are no options
                                    if (
                                        !filterOptions[metakey] ||
                                        filterOptions[metakey].length === 0
                                    ) {
                                        return null;
                                    }

                                    const multiple =
                                        display_options === 'multi-checklist' ||
                                        display_options === 'multi-select' ||
                                        display_options === 'multi-typeahead';

                                    return (
                                        <StyledFilterItem
                                            key={metakey}
                                            open={filterVisibility[metakey]}
                                            onClick={() => {
                                                const updated = {
                                                    ...filterVisibility,
                                                };

                                                updated[metakey] =
                                                    !updated[metakey];

                                                setFilterVisibility(updated);
                                            }}
                                        >
                                            <StyledFilterTitle>
                                                <span>
                                                    <b>
                                                        Filter by{' '}
                                                        {metakey
                                                            .slice(0, 1)
                                                            .toUpperCase() +
                                                            metakey.slice(1)}
                                                    </b>
                                                </span>
                                                <StyledFilterIcon
                                                    color="primary"
                                                    path={
                                                        'M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z'
                                                    }
                                                ></StyledFilterIcon>
                                            </StyledFilterTitle>
                                            {filterVisibility[metakey] && (
                                                <StyledFilterOpen
                                                    onClick={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                >
                                                    <Checklist
                                                        defaultValue={
                                                            multiple ? [] : null
                                                        }
                                                        multiple={multiple}
                                                        options={
                                                            filterOptions[
                                                                metakey
                                                            ] || []
                                                        }
                                                        getDisplay={(
                                                            option,
                                                        ) => {
                                                            return `${option.value} (${option.count})`;
                                                        }}
                                                        getKey={(option) => {
                                                            return option.value;
                                                        }}
                                                        onChange={(option) => {
                                                            const updated = {
                                                                ...filterValues,
                                                            };

                                                            if (option) {
                                                                updated[
                                                                    metakey
                                                                ] = multiple
                                                                    ? option.map(
                                                                          (o) =>
                                                                              o.value,
                                                                      )
                                                                    : option.value;
                                                            } else {
                                                                updated[
                                                                    metakey
                                                                ] = null;
                                                            }

                                                            setFilterValues(
                                                                updated,
                                                            );
                                                        }}
                                                    />
                                                </StyledFilterOpen>
                                            )}
                                        </StyledFilterItem>
                                    );
                                })}
                            </StyledFilter>
                        </StyledControl>
                    ) : null}
                </StyledMenu>
                {getDatabases.status === 'SUCCESS' ? (
                    <StyledGrid gutterX={theme.space['8']}>
                        {getDatabases.data.map((database) => {
                            const database_name = String(
                                database.database_name,
                            ).replace(/_/g, ' ');

                            return (
                                <Grid.Item
                                    key={database.database_id}
                                    responsive={{
                                        sm: 12,
                                        md: 6,
                                        lg: 4,
                                        xl: 3,
                                    }}
                                >
                                    <StyledLink
                                        to={`/database/${database.database_id}`}
                                    >
                                        <DatabaseCard
                                            name={database_name}
                                            description={database.description}
                                            image={`${process.env.MODULE}/api/app-${database.database_id}/appImage/download`}
                                            tag={database.tag}
                                            global={
                                                view === 'My Databases'
                                                    ? true
                                                    : false
                                            }
                                        ></DatabaseCard>
                                    </StyledLink>
                                </Grid.Item>
                            );
                        })}
                    </StyledGrid>
                ) : null}
            </StyledCatalog>
        </Page>
    );
});
