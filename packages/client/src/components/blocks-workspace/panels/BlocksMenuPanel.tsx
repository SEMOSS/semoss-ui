import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { Badge } from '@mui/material';
import { Search, Tune } from '@mui/icons-material';

import {
    styled,
    Grid,
    Stack,
    TextField,
    ToggleTabsGroup,
    Typography,
    Divider,
    InputAdornment,
    IconButton,
} from '@semoss/ui';

import { AddBlocksMenuCard } from '@/components/designer';
import { Panel } from '@/components/workspace';
import { SECTION_ORDER } from '../menus/default-menu';
import { BlocksMenuPanelFilterMenu } from './BlocksMenuPanelFilterMenu';
import {
    BlockLocalStorageData,
    DesignerMenuItem,
    FilterCategory,
} from '../menus/menu-types';
import { runPixel } from '@/api';
import { BlockJSON } from '@semoss/renderer';

const SECTION_FLOWS = 'Mermaid Charts';

const StyledTitle = styled('div')(({ theme }) => ({
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    backgroundColor: theme.palette.primary.selected,
    color: theme.palette.info.dark,
    width: '100%',
}));

const StyledHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    lineHeight: theme.spacing(5),
    paddingTop: theme.spacing(1.5),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(1.5),
    paddingLeft: theme.spacing(2),
    gap: theme.spacing(1),
}));

const StyledToggleTabsGroup = styled(ToggleTabsGroup)(({ theme }) => ({
    border: '1px',
    minHeight: '42px',
    color: theme.palette.secondary.light,
    borderRadius: theme.shape.borderRadius,
    alignItems: 'center',
    padding: '0px 3px',
    width: '100%',
}));

const StyledToggleTabsGroupItem = styled(ToggleTabsGroup.Item)(({ theme }) => ({
    height: '38px',
    padding: '8px 11px',
    '&.MuiTab-root': {
        borderRadius: theme.shape.borderRadius,
    },
    '&.Mui-selected': {
        boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.05)',
    },
}));

const StyledMenu = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingBottom: theme.spacing(2),
}));

const StyledGridWrapper = styled('div')({
    width: '100%',
});

const StyledTypography = styled(Typography)({
    userSelect: 'none',
});

const StyledSection = styled('div')(({ theme }) => ({
    ...theme.typography.caption,
}));

type MODE = 'CLIENT' | 'SYSTEM';
export interface AddBlocksMenuProps {
    /** Title to render in the menu */
    title: string;

    /** Items to add to show in the menu.  */
    items: DesignerMenuItem[];
}

const defaultSection = 'Miscellaneous';

/**
 * Add Blocks to the UI
 */
export const BlocksMenuPanel = observer((props: AddBlocksMenuProps) => {
    const { title, items } = props;

    const [search, setSearch] = useState('');
    const [clientBlock, setClientBlock] = useState([]);
    const [mode, setMode] = useState<MODE>('SYSTEM');

    const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
    const [filterCategoryMap, setFilterCategoryMap] = useState<
        Record<string, FilterCategory>
    >({});

    const anyEnabledFilter = useMemo(
        () =>
            Object.values(filterCategoryMap).some(
                (category) => category.enabled,
            ),
        [filterCategoryMap],
    );

    const getClientBlocks = async () => {
        runPixel('1+1').then((res) => {
            const dummyData = [
                {
                    section: SECTION_FLOWS,
                    name: 'Class Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            text: '---\ntitle: Alien example\n---\nclassDiagram\n    note "From Duck till Zebra"\n    Animal <|-- Duck\n    note for Duck "can fly\ncan swim\ncan dive\ncan help in debugging"\n    Animal <|-- Fish\n    Animal <|-- Zebra\n    Animal : +int age\n    Animal : +String gender\n    Animal: +isMammal()\n    Animal: +mate()\n    class Duck{\n        +String beakColor\n        +swim()\n        +quack()\n    }\n    class Fish{\n        -int sizeInFeet\n        -canEat()\n    }\n    class Zebra{\n        +bool is_wild\n        +run()\n    }\n',
                        },
                        listeners: {},
                        slots: {},
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Sequence Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `sequenceDiagram
                    participant Alice
                    participant Bob
                    Alice->>Bob: Hi Bob
                    Bob->>Alice: Hi Alice
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'State Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `---
                title: Simple sample
                ---
                stateDiagram-v2
                    [*] --> Still
                    Still --> [*]
                
                    Still --> Moving
                    Moving --> Still
                    Moving --> Crash
                    Crash --> [*]
                
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Entity Relationship Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `---
                title: Order example
                ---
                erDiagram
                    CUSTOMER ||--o{ ORDER : places
                    ORDER ||--|{ LINE-ITEM : contains
                    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'User Journey',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `journey
                    title My working day
                    section Go to work
                      Make tea: 5: Me
                      Go upstairs: 3: Me
                      Do work: 1: Me, Cat
                    section Go home
                      Go downstairs: 5: Me
                      Sit down: 5: Me
                
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Gantt',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `gantt
                    title A Gantt Diagram
                    dateFormat YYYY-MM-DD
                    section Section
                        A task          :a1, 2014-01-01, 30d
                        Another task    :after a1, 20d
                    section Another
                        Task in Another :2014-01-12, 12d
                        another task    :24d
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Pie Chart',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `pie title Pets adopted by volunteers
                    "Dogs" : 386
                    "Cats" : 85
                    "Rats" : 15
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Quadrant Chart',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `quadrantChart
                    title Reach and engagement of campaigns
                    x-axis Low Reach --> High Reach
                    y-axis Low Engagement --> High Engagement
                    quadrant-1 We should expand
                    quadrant-2 Need to promote
                    quadrant-3 Re-evaluate
                    quadrant-4 May be improved
                    Campaign A: [0.3, 0.6]
                    Campaign B: [0.45, 0.23]
                    Campaign C: [0.57, 0.69]
                    Campaign D: [0.78, 0.34]
                    Campaign E: [0.40, 0.34]
                    Campaign F: [0.35, 0.78]
                
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Requirement Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `requirementDiagram
                
                requirement test_req {
                id: 1
                text: the test text.
                risk: high
                verifymethod: test
                }
                
                element test_entity {
                type: simulation
                }
                
                test_entity - satisfies -> test_req
                
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Git Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `---
                title: Example Git diagram
                ---
                gitGraph
                   commit
                   commit
                   branch develop
                   checkout develop
                   commit
                   commit
                   checkout main
                   merge develop
                   commit
                   commit
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: SECTION_FLOWS,
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `C4Context
                  title System Context diagram for Internet Banking System
                  Enterprise_Boundary(b0, "BankBoundary0") {
                    Person(customerA, "Banking Customer A", "A customer of the bank, with personal bank accounts.")
                    Person(customerB, "Banking Customer B")
                    Person_Ext(customerC, "Banking Customer C", "desc")
                
                    Person(customerD, "Banking Customer D", "A customer of the bank, <br/> with personal bank accounts.")
                
                    System(SystemAA, "Internet Banking System", "Allows customers to view information about their bank accounts, and make payments.")
                
                    Enterprise_Boundary(b1, "BankBoundary") {
                
                        SystemDb_Ext(SystemE, "Mainframe Banking System", "Stores all of the core banking information about customers, accounts, transactions, etc.")
                
                        System_Boundary(b2, "BankBoundary2") {
                          System(SystemA, "Banking System A")
                          System(SystemB, "Banking System B", "A system of the bank, with personal bank accounts. next line.")
                        }
                
                        System_Ext(SystemC, "E-mail system", "The internal Microsoft Exchange e-mail system.")
                        SystemDb(SystemD, "Banking System D Database", "A system of the bank, with personal bank accounts.")
                
                        Boundary(b3, "BankBoundary3", "boundary") {
                          SystemQueue(SystemF, "Banking System F Queue", "A system of the bank.")
                          SystemQueue_Ext(SystemG, "Banking System G Queue", "A system of the bank, with personal bank accounts.")
                        }
                    }
                }
                
                      BiRel(customerA, SystemAA, "Uses")
                      BiRel(SystemAA, SystemE, "Uses")
                      Rel(SystemAA, SystemC, "Sends e-mails", "SMTP")
                      Rel(SystemC, customerA, "Sends e-mails to")
                
                      UpdateElementStyle(customerA, $fontColor="red", $bgColor="grey", $borderColor="red")
                      UpdateRelStyle(customerA, SystemAA, $textColor="blue", $lineColor="blue", $offsetX="5")
                      UpdateRelStyle(SystemAA, SystemE, $textColor="blue", $lineColor="blue", $offsetY="-10")
                      UpdateRelStyle(SystemAA, SystemC, $textColor="blue", $lineColor="blue", $offsetY="-40", $offsetX="-50")
                      UpdateRelStyle(SystemC, customerA, $textColor="red", $lineColor="red", $offsetX="-50", $offsetY="20")
                
                      UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
                
                
                
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Mindmap',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `mindmap
                  root((mindmap))
                    Origins
                      Long history
                      ::icon(fa fa-book)
                      Popularisation
                        British popular psychology author Tony Buzan
                    Research
                      On effectiveness<br/>and features
                      On Automatic creation
                        Uses
                            Creative techniques
                            Strategic planning
                            Argument mapping
                    Tools
                      Pen and paper
                      Mermaid
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Timeline',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `timeline
                    title History of Social Media Platform
                    2002 : LinkedIn
                    2004 : Facebook
                         : Google
                    2005 : Youtube
                    2006 : Twitter
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Sankey',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `---
                config:
                  sankey:
                    showValues: false
                ---
                sankey-beta
                
                Agricultural 'waste',Bio-conversion,124.729
                Bio-conversion,Liquid,0.597
                Bio-conversion,Losses,26.862
                Bio-conversion,Solid,280.322
                Bio-conversion,Gas,81.144
                Biofuel imports,Liquid,35
                Biomass imports,Solid,35
                Coal imports,Coal,11.606
                Coal reserves,Coal,63.965
                Coal,Solid,75.571
                District heating,Industry,10.639
                District heating,Heating and cooling - commercial,22.505
                District heating,Heating and cooling - homes,46.184
                Electricity grid,Over generation / exports,104.453
                Electricity grid,Heating and cooling - homes,113.726
                Electricity grid,H2 conversion,27.14
                Electricity grid,Industry,342.165
                Electricity grid,Road transport,37.797
                Electricity grid,Agriculture,4.412
                Electricity grid,Heating and cooling - commercial,40.858
                Electricity grid,Losses,56.691
                Electricity grid,Rail transport,7.863
                Electricity grid,Lighting & appliances - commercial,90.008
                Electricity grid,Lighting & appliances - homes,93.494
                Gas imports,Ngas,40.719
                Gas reserves,Ngas,82.233
                Gas,Heating and cooling - commercial,0.129
                Gas,Losses,1.401
                Gas,Thermal generation,151.891
                Gas,Agriculture,2.096
                Gas,Industry,48.58
                Geothermal,Electricity grid,7.013
                H2 conversion,H2,20.897
                H2 conversion,Losses,6.242
                H2,Road transport,20.897
                Hydro,Electricity grid,6.995
                Liquid,Industry,121.066
                Liquid,International shipping,128.69
                Liquid,Road transport,135.835
                Liquid,Domestic aviation,14.458
                Liquid,International aviation,206.267
                Liquid,Agriculture,3.64
                Liquid,National navigation,33.218
                Liquid,Rail transport,4.413
                Marine algae,Bio-conversion,4.375
                Ngas,Gas,122.952
                Nuclear,Thermal generation,839.978
                Oil imports,Oil,504.287
                Oil reserves,Oil,107.703
                Oil,Liquid,611.99
                Other waste,Solid,56.587
                Other waste,Bio-conversion,77.81
                Pumped heat,Heating and cooling - homes,193.026
                Pumped heat,Heating and cooling - commercial,70.672
                Solar PV,Electricity grid,59.901
                Solar Thermal,Heating and cooling - homes,19.263
                Solar,Solar Thermal,19.263
                Solar,Solar PV,59.901
                Solid,Agriculture,0.882
                Solid,Thermal generation,400.12
                Solid,Industry,46.477
                Thermal generation,Electricity grid,525.531
                Thermal generation,Losses,787.129
                Thermal generation,District heating,79.329
                Tidal,Electricity grid,9.452
                UK land based bioenergy,Bio-conversion,182.01
                Wave,Electricity grid,19.013
                Wind,Electricity grid,289.366
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'XY Chart',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `xychart-beta
                    title "Sales Revenue"
                    x-axis [jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec]
                    y-axis "Revenue (in $)" 4000 --> 11000
                    bar [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
                    line [5000, 6000, 7500, 8200, 9500, 10500, 11000, 10200, 9200, 8500, 7000, 6000]
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: SECTION_FLOWS,
                    name: 'Block Diagram',
                    helperText: '',
                    json: {
                        widget: 'mermaid',
                        data: {
                            text: `block-beta
                columns 1
                  db(("DB"))
                  blockArrowId6<["&nbsp;&nbsp;&nbsp;"]>(down)
                  block:ID
                    A
                    B["A wide one in the middle"]
                    C
                  end
                  space
                  D
                  ID --> D
                  C --> D
                  style B fill:#969,stroke:#333,stroke-width:4px
                `,
                        },
                        listeners: {},
                        slots: {} as BlockJSON['slots'],
                    },
                },
                {
                    section: 'Grouped Items',
                    name: 'Input within a container',
                    helperText: '',
                    json: {
                        widget: 'container',
                        parent: {
                            id: 'page-1',
                            slot: 'content',
                        },
                        data: {
                            style: {
                                display: 'flex',
                                flexDirection: 'column',
                                padding: '4px',
                                gap: '8px',
                                flexWrap: 'wrap',
                                border: '4px solid ',
                            },
                            route: 'container--6732',
                        },
                        listeners: {},
                        slots: {
                            children: [
                                {
                                    widget: 'text',
                                    data: {
                                        style: {
                                            padding: '4px',
                                            whiteSpace: 'pre-line',
                                            textOverflow: 'ellipsis',
                                        },
                                        text: 'Grouped Component',
                                        variant: 'h1',
                                    },
                                    listeners: {},
                                    slots: {},
                                },
                                {
                                    widget: 'input',
                                    data: {
                                        style: {
                                            width: '100%',
                                            padding: '4px',
                                        },
                                        value: '',
                                        label: 'Example Input',
                                        hint: '',
                                        type: 'text',
                                        rows: 1,
                                        multiline: false,
                                        disabled: false,
                                        required: false,
                                        loading: false,
                                    },
                                    listeners: {
                                        onChange: [],
                                    },
                                    slots: {
                                        content: [],
                                    },
                                },
                                {
                                    widget: 'audio-input',
                                    parent: {
                                        id: 'page-1',
                                        slot: 'content',
                                    },
                                    data: {
                                        style: {
                                            width: '50px',
                                            height: '60px',
                                        },
                                        loading: false,
                                        disabled: false,
                                        variant: 'contained',
                                        color: 'primary',
                                        value: '',
                                        mode: 'transcribe',
                                    },
                                    listeners: {
                                        onClick: [],
                                    },
                                    slots: {},
                                },
                            ],
                        },
                    },
                },
            ];
            setClientBlock(dummyData);
        });
    };

    useEffect(() => {
        if (mode === 'CLIENT') {
            getClientBlocks();
        }
    }, [mode]);

    const sortedItems = useMemo(() => {
        // Use Client Block when mode is CLIENT otherwise use items from the props
        const dataToProcess = mode === 'CLIENT' ? clientBlock : items;
        const sectionRecord: Record<string, DesignerMenuItem[]> = {};

        // Group items by section
        dataToProcess.forEach((item) => {
            const currentSection = item.section ?? defaultSection;
            if (!sectionRecord[currentSection])
                sectionRecord[currentSection] = [];
            sectionRecord[currentSection].push(item);
        });

        // Sort sections based on sectionOrder
        return SECTION_ORDER.map((section) => {
            const sectionItems = sectionRecord[section] || [];
            return sectionItems.sort((a, b) =>
                a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
            );
        }).filter((section) => section.length > 0);
    }, [items, mode, clientBlock, SECTION_ORDER]);

    // get the rendered items
    const renderedItems: DesignerMenuItem[][] = useMemo(() => {
        // calculate whether any sections are being filtered
        const anySectionFilter = Object.values(filterCategoryMap).some(
            (filter) => filter.type === 'SECTION' && filter.enabled,
        );

        // room to improve this logic in the future, but for now just keep 6 most used blocks
        const localStorageMap: Record<string, BlockLocalStorageData> =
            JSON.parse(localStorage.getItem('blocks--frequently-used')) ?? {};
        const mostUsedSet = Object.values(localStorageMap)
            .filter((item) => item.use_count)
            .sort((a, b) => a.use_count - b.use_count)
            .slice(0, 6)
            .reduce((acc, curr) => {
                acc.add(curr.widget);
                return acc;
            }, new Set<string>());

        // filter out sections
        const selectSectionItems = (
            sectionItems: DesignerMenuItem[],
        ): DesignerMenuItem[] => {
            if (filterCategoryMap[sectionItems[0].section]?.enabled) {
                // this section is a selected filter; show all of its items
                return sectionItems;
            } else if (filterCategoryMap['Most Used Components']?.enabled) {
                // "Most Used Components" is enabled; return this section's items if they are in most used
                return sectionItems.filter((item) =>
                    mostUsedSet.has(item.json.widget),
                );
            } else if (anySectionFilter) {
                // There are section filters applied, but this section is not selected, return nothing
                return [];
            } else {
                // There are no filters applied, return everything
                return sectionItems;
            }
        };
        const filteredItems = sortedItems
            .map(selectSectionItems)
            .filter((sectionItems) => sectionItems.length);

        if (!search) {
            return filteredItems;
        }

        const s = search.replace(/[^a-z0-9]/gi, '').toLowerCase();

        return (
            filteredItems
                .map((sectionItems) =>
                    // pattern match on s
                    sectionItems.filter((item) =>
                        item.name
                            .replace(/[^a-z0-9]/gi, '')
                            .toLowerCase()
                            .includes(s),
                    ),
                )
                // only include sections that have remaining blocks
                .filter((sectionItems) => sectionItems.length)
        );
    }, [sortedItems, search, filterCategoryMap]);

    useEffect(() => {
        setFilterCategoryMap(() => {
            const uniqueSectionMap = items.reduce((acc, curr) => {
                acc[curr.section] = true;
                return acc;
            }, {});
            const sortedSections = Object.keys(uniqueSectionMap).sort();
            return sortedSections.reduce(
                (acc, curr) => {
                    acc[curr] = {
                        id: curr,
                        enabled: false,
                        type: 'SECTION',
                    } satisfies FilterCategory;
                    return acc;
                },
                {
                    'Most Used Components': {
                        id: 'Most Used Components',
                        enabled: false,
                        type: 'MOST_USED_COMPONENTS',
                    } satisfies FilterCategory,
                },
            );
        });
    }, [items]);

    return (
        <Panel>
            <Stack height="100%">
                <StyledTitle>
                    <Typography variant={'h6'}>{title}</Typography>
                </StyledTitle>
                <Stack paddingTop={2} paddingLeft={2} paddingRight={2}>
                    <TextField
                        placeholder="Search Components"
                        size="small"
                        fullWidth
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        size="small"
                                        onClick={(e) =>
                                            setMenuAnchorEl(e.currentTarget)
                                        }
                                    >
                                        <Badge
                                            variant="dot"
                                            invisible={!anyEnabledFilter}
                                            color="primary"
                                        >
                                            <Tune />
                                        </Badge>
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <StyledToggleTabsGroup
                        value={mode}
                        onChange={(e: React.SyntheticEvent, val) => {
                            setMode(val as MODE);
                            if (val === 'CLIENT') {
                                getClientBlocks();
                            }
                        }}
                    >
                        <StyledToggleTabsGroupItem
                            label="System Blocks"
                            value={'SYSTEM'}
                        />
                        <StyledToggleTabsGroupItem
                            label="Client Blocks"
                            value={'CLIENT'}
                            // disabled={true}
                        />
                    </StyledToggleTabsGroup>
                    {/* 
                    // TODO: Coming next, asked van buren to
                    // start looking at how to incorporate groupings,
                    // if not done by 2/19/25, will take it over 
                    */}
                </Stack>

                {/* TODO: Two Different Menus: Client and System */}
                {/* Rendering on basis of client and system mode */}
                {renderedItems.length ? (
                    <StyledMenu>
                        {renderedItems.map((sectionItems, index) => (
                            <Stack
                                key={sectionItems[0].section ?? defaultSection}
                                width="100%"
                            >
                                {index > 0 && (
                                    <Stack paddingTop={1}>
                                        <Divider variant="fullWidth" flexItem />
                                    </Stack>
                                )}
                                <Stack padding={2}>
                                    <StyledTypography
                                        variant="subtitle2"
                                        key={index}
                                    >
                                        {sectionItems[0].section ??
                                            defaultSection}
                                    </StyledTypography>
                                </Stack>
                                <StyledGridWrapper>
                                    <Grid
                                        container
                                        spacing={2}
                                        width="100%"
                                        paddingLeft={2}
                                    >
                                        {sectionItems.map((block) => (
                                            <Grid item key={block.name}>
                                                <AddBlocksMenuCard
                                                    item={block}
                                                />
                                            </Grid>
                                        ))}
                                    </Grid>
                                </StyledGridWrapper>
                            </Stack>
                        ))}
                    </StyledMenu>
                ) : (
                    <Stack padding={2}>
                        <Typography variant="subtitle2">
                            No items found
                        </Typography>
                    </Stack>
                )}
            </Stack>
            <BlocksMenuPanelFilterMenu
                anchorEl={menuAnchorEl}
                onClose={() => setMenuAnchorEl(null)}
                categoryMap={filterCategoryMap}
                setCategoryMap={setFilterCategoryMap}
            />
        </Panel>
    );
});
