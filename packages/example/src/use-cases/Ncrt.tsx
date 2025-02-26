import React from 'react';

import { Env, InsightProvider } from '@semoss/sdk';
import { ActionMessages, Renderer, SerializedState } from '@semoss/renderer';

const state: SerializedState = {
    queries: {
        submit_request: {
            id: 'submit_request',
            cells: [
                {
                    id: '53064',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: '{\r\n    "VISN":"{{selected_visn}}",\r\n    "STATION":"{{selected_station}}",\r\n    "FACILITY_ID":"{{selected_facility}}",\r\n    "IFCAP_PO":"",\r\n    "TOTAL_COST":{{price}},\r\n    "REQUEST_TYPE":"{{item_type}}",\r\n    "SHIP_NAME": "{{name}}",\r\n    "SHIP_PHONE":"{{phone_num}}",\r\n    "SHIP_PHONE_EXTENSION":"{{phone_num}}",\r\n    "SHIP_EMAIL":"{{email}}",\r\n    "ADD_INSTRUCTIONS":"{{add_info}}",\r\n    "NCRT_SHIP_ID":"{{ncrtShipId}}",\r\n    "SHIP_ADDRESS": "{{addy}}",\r\n    "VHA_4TH_MISSION": false,\r\n    "IS_CATALOG_REQUEST": true,\r\n    "items": [\r\n    {\r\n        "VSSC_GROUP": "{{selected_group}}",\r\n        "VSSC_CATEGORY":"{{selected_category}}",\r\n        "SIZE_NEEDED": "{{size}}",\r\n        "QUANTITY_REQUESTED": {{quant_uop_needed}},\r\n        "UOP":"{{uop}}",\r\n        "ITEM_DESCRIPTION":"{{item_desc}}",\r\n        "COUNT_UOP":{{count_uop}},\r\n        "COST_UOP":{{cost}},\r\n        "TOTAL_ITEM_COST":{{price}},\r\n        "ITEM_TYPE":"{{selected_item}}",\r\n        "MANUFACTURER_NAME":"{{manu_name}}",\r\n        "OEM_PART_NUMBER": "{{oem_part_num}}",\r\n        "IS_CATALOG_ITEM":{{is_cat_item}},\r\n        "IS_SURGICAL":{{isSurgery}},\r\n        "ITEM_SUB_ALLOWED":{{allowSub}},\r\n\r\n        "DATE_NEEDED":"2025-02-14",\r\n        "MANUFACTURER_DUNS":"",\r\n        "MANUFACTURER_UEI": "",\r\n        "REQUEST_ITEM_COMMENT":"",\r\n        "EQUIPMENT_SEPG":"",\r\n        "accessories":[]\r\n\r\n    }\r\n    ]\r\n}',
                    },
                },
                {
                    id: '77529',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: 'SubmitRequest(database=["{{ncrt_db_id}}"], map=[{{java_submit_obj}}]);',
                    },
                },
                {
                    id: '83416',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '# "SUBMIT REQUEST HAS GONE THROUGH"',
                    },
                },
                {
                    id: '20430',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: '{{java_submit_obj}}',
                    },
                },
            ],
        },
        get_request_options: {
            id: 'get_request_options',
            cells: [
                {
                    id: '96686',
                    widget: 'code',
                    parameters: {
                        code: 'from semoss import Insight\r\ninsight = Insight(insight_id = \'${i}\')\r\n\r\nfacility_list = insight.run_pixel("GetRequestFacilities();")\r\n\r\nrequestable_item_info = insight.run_pixel("GetRequestableItemInfo(filters=[Filter((CATALOG__CATALOG_TYPE == \'COMMODITY\'))]);")\r\n\r\npixelResult = {\r\n    "items": requestable_item_info,\r\n    "facilities": facility_list\r\n}\r\n\r\npixelResult',
                        type: 'py',
                    },
                },
                {
                    id: '30014',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'facility_list\r\n\r\nvisns = list(facility_list.keys())\r\n\r\nvisns',
                    },
                },
                {
                    id: '67063',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'selected_v = "{{selected_visn}}"\r\nprint("p", selected_v)\r\n\r\nstations = []\r\n\r\nif selected_v is not None and selected_v != \'undefined\' and selected_v != \'\':\r\n    stations = list(facility_list[selected_v].keys())\r\n\r\nstations',
                    },
                },
                {
                    id: '28365',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_s = \"{{selected_station}}\"\r\nprint(selected_s)\r\n\r\nfacilities = []\r\n\r\nif selected_s is not None and selected_s != 'undefined' and selected_s != '': \r\n    facilities = list(facility_list[selected_v][selected_s].keys())\r\n\r\nfacilities",
                    },
                },
                {
                    id: '67337',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nselected_v = "{{selected_visn}}"\r\nselected_s = "{{selected_station}}"\r\nselected_f = "{{selected_facility}}"\r\n\r\nselected_facility_info = {}\r\n\r\nif (selected_v is not None and selected_v != \'undefined\' and selected_v != \'\' and\r\n    selected_s is not None and selected_s != \'undefined\' and selected_s != \'\' and\r\n    selected_f is not None and selected_f != \'undefined\' and selected_f != \'\'):\r\n    print(\'hey\')\r\n    fac = json.loads("""{{pixel_call}}""")\r\n    selected_facility_info = fac["facilities"]["{{selected_visn}}"]["{{selected_station}}"]["{{selected_facility}}"][0]\r\n\r\nselected_facility_info',
                    },
                },
                {
                    id: '45406',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'print({{fac_info}})\r\nncrtShipId = ""\r\n\r\nif ({{fac_info}} and len({{fac_info}}) > 0):\r\n    ncrtShipId = {{fac_info}}["ncrtShipId"]\r\n\r\nncrtShipId',
                    },
                },
                {
                    id: '85694',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'addy = \'\'\r\nif ({{fac_info}} and len({{fac_info}}) > 0):\r\n    addy = {{fac_info}}["address"]\r\n\r\naddy',
                    },
                },
                {
                    id: '65652',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '"-------------------------------------------------------"',
                    },
                },
                {
                    id: '77120',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'requestable_item_info\r\n\r\ngroups = list(requestable_item_info.keys())\r\n\r\ngroups',
                    },
                },
                {
                    id: '49665',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_g = \"{{selected_group}}\"\r\n\r\ncategories = []\r\n\r\nif selected_g is not None and selected_g != 'undefined' and selected_g != '':\r\n    categories = list(requestable_item_info[selected_g].keys())\r\n\r\ncategories",
                    },
                },
                {
                    id: '9881',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_c = \"{{selected_category}}\"\r\n\r\nitms = []\r\n\r\nif selected_c is not None and selected_c != 'undefined' and selected_c != '':\r\n    itms = list(requestable_item_info[selected_g][selected_c].keys())\r\n\r\nitms",
                    },
                },
            ],
        },
        get_item_details: {
            id: 'get_item_details',
            cells: [
                {
                    id: '15361',
                    widget: 'code',
                    parameters: {
                        code: 'import json \r\n\r\nparsed = json.loads("""{{pixel_call}}""")\r\n\r\nparsed',
                        type: 'py',
                    },
                },
                {
                    id: '58510',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'item_info = parsed["items"]["{{selected_group}}"]["{{selected_category}}"]["{{selected_item}}"]',
                    },
                },
                {
                    id: '51981',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: 'GetCatalogItems(filters=[Filter(CATALOG__ITEM_TYPE==["{{selected_item}}"])]);',
                    },
                },
                {
                    id: '41113',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["MANUFACTURER_NAME"]',
                    },
                },
                {
                    id: '76103',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["MANUFACTURER_DUNS"]',
                    },
                },
                {
                    id: '23418',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["SIZE"]',
                    },
                },
                {
                    id: '28529',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["UOP"]',
                    },
                },
                {
                    id: '87532',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["APPROX_PALLET_SIZE"]',
                    },
                },
                {
                    id: '3521',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["ITEM_DESCRIPTION"]',
                    },
                },
                {
                    id: '29237',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["OEM_PART_NUMBER"]',
                    },
                },
                {
                    id: '14083',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["COST_UOP"]',
                    },
                },
                {
                    id: '89358',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["REQUESTABLE_QTY_CASES"]',
                    },
                },
                {
                    id: '16171',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["REQUESTABLE_QTY_EA"]',
                    },
                },
                {
                    id: '6290',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["INVENTORY_DATE"]',
                    },
                },
                {
                    id: '31712',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["COUNT_UOP"]',
                    },
                },
                {
                    id: '86478',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["CRITICAL_INVENTORY_LEVEL"]',
                    },
                },
            ],
        },
        calculate_item_values: {
            id: 'calculate_item_values',
            cells: [
                {
                    id: '72814',
                    widget: 'code',
                    parameters: {
                        code: '{{quant_uop_needed}} * {{cost}}',
                        type: 'py',
                    },
                },
                {
                    id: '88277',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '{{quant_uop_needed}} * {{count_uop}}',
                    },
                },
            ],
        },
    },
    blocks: {
        'page-1': {
            slots: {
                content: {
                    children: ['container--4447', 'container--4028'],
                    name: 'content',
                },
            },
            widget: 'page',
            data: {
                style: {
                    padding: '0px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: '#f8f8f9',
                },
                route: '',
            },
            listeners: {
                onPageLoad: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            id: 'page-1',
        },
        'container--5853': {
            id: 'container--5853',
            widget: 'container',
            parent: {
                id: 'container--4028',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    margin: '48px',
                },
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--2475',
                        'text--2934',
                        'text--4172',
                        'markdown--3077',
                        'text--5029',
                        'container--718',
                        'text--7699',
                        'container--5946',
                        'text--7466',
                        'container--4934',
                        'container--5755',
                        'text--6404',
                    ],
                },
            },
        },
        'text--2934': {
            id: 'text--2934',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Use this section to request critical supplies, including Personal Protective Equipment (PPE).',
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'text--4172': {
            id: 'text--4172',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: "VA Facilities should maintain the appropriate levels of emergency supplies (e.g., PPE) per applicable VA regulations. This request portal should be completed by Facility CSCOs when there is a critical need for supplies and all attempts to leverage the established cupply chain channels have been unsuccessful. For example, if the Prime Vendor cannot honor a facility's order for the PPE items.",
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'markdown--3077': {
            id: 'markdown--3077',
            widget: 'markdown',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                markdown: '---',
            },
            listeners: {},
            slots: {},
        },
        'container--718': {
            id: 'container--718',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--8664',
                        'select--4306',
                        'select--6283',
                        'select--1578',
                        'radio--5298',
                        'container--8402',
                    ],
                },
            },
        },
        'text--8664': {
            id: 'text--8664',
            widget: 'text',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Required fields are marked with an asterisk (*).',
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'select--4306': {
            id: 'select--4306',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'VISN',
                hint: '',
                options: '{{visns.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--6283': {
            id: 'select--6283',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'STATION',
                hint: '',
                options: '{{stations.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--1578': {
            id: 'select--1578',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'FACILITY',
                hint: '',
                options: '{{facilities.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'radio--5298': {
            id: 'radio--5298',
            widget: 'radio',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                value: 'COMMODITY',
                label: "Please select an option for the request's type *",
                isGroup: false,
                options: [
                    {
                        label: 'Commodities',
                        value: 'COMMODITY',
                    },
                    {
                        label: 'Equipment',
                        value: 'EQUIPMENT',
                    },
                ],
                size: 'medium',
                direction: 'column',
                color: 'primary',
                labelPlacement: 'end',
                required: false,
                disabled: false,
                route: 'radio--5298',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'checkbox--1671': {
            id: 'checkbox--1671',
            widget: 'checkbox',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: false,
                route: 'checkbox--1671',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--8402': {
            id: 'container--8402',
            widget: 'container',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: 'left',
                    alignItems: 'center',
                },
                route: 'container--8402',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--1671', 'text--576', 'input--4004'],
                },
            },
        },
        'text--576': {
            id: 'text--576',
            widget: 'text',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'I confirm all the items within this request will be used in support of the VHA 4th Mission Objectives',
                variant: 'p',
                route: 'text--576',
            },
            listeners: {},
            slots: {},
        },
        'input--4004': {
            id: 'input--4004',
            widget: 'input',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Zero Cost PO (optional)',
                hint: "Please create a 'Zero Cost' Purchase Order within IFCAP when requesting an order in the NCRT and provide the associated purchase order number. (0/50)",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--4004',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5946': {
            id: 'container--5946',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
                route: 'container--5946',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'input--7344',
                        'button--8309',
                        'input--8432',
                        'input--3977',
                        'input--9160',
                        'input--5159',
                        'input--413',
                    ],
                },
            },
        },
        'input--7344': {
            id: 'input--7344',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'June',
                label: 'Name',
                hint: ' Please enter a name for the shipping address of 50 characters or less. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--7344',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8432': {
            id: 'input--8432',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{addy}}',
                label: 'Address',
                hint: 'If you cannot find the address you would like to ship to, please contact your facility Chief Logistics Officer and ask that they complete an AAC Requestopens in a new tab.This will enable your Chief Supply Chain Officer to create or update an AAC address. Once the location has an ACC code created (or is updated), please alert your Customer Service Representative, so that the address can be added to the NCRT tool.',
                type: 'text',
                rows: '3',
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--8432',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3977': {
            id: 'input--3977',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'info',
                label: 'Additional Info',
                hint: 'Please do not include PII or PHI in this field. Also, this field has a maximum character limit of 500. (0/500)',
                type: 'text',
                rows: '3',
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--3977',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--9160': {
            id: 'input--9160',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '7032211212',
                label: 'Phone Number',
                hint: ' Enter a valid phone number.. Please enter as ##########',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--9160',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--5159': {
            id: 'input--5159',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '1',
                label: 'Extension',
                hint: 'Extension has a maximum character limit of 50. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--5159',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--413': {
            id: 'input--413',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'jbax@gmail.com',
                label: 'Email',
                hint: ' Email address has a maximum character limit of 50. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--413',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'button--8309': {
            id: 'button--8309',
            widget: 'button',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'View Other Adresses',
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
                route: 'button--8309',
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        'container--4934': {
            id: 'container--4934',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
                route: 'container--4934',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'container--7666',
                        'text--2675',
                        'container--3469',
                        'container--4086',
                    ],
                },
            },
        },
        'button--7279': {
            id: 'button--7279',
            widget: 'button',
            parent: {
                id: 'container--5755',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'Reset',
                loading: false,
                disabled: false,
                variant: 'outlined',
                color: 'primary',
                route: 'button--7279',
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        'button--4571': {
            id: 'button--4571',
            widget: 'button',
            parent: {
                id: 'container--5755',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'Submit',
                loading: '{{sub_req-sheet.isLoading}}',
                disabled: false,
                variant: 'contained',
                color: 'primary',
                route: 'button--4571',
            },
            listeners: {
                onClick: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'submit_request',
                        },
                    },
                ],
            },
            slots: {},
        },
        'container--5755': {
            id: 'container--5755',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #ffffff',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                route: 'container--5755',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['button--7279', 'button--4571'],
                },
            },
        },
        'container--7666': {
            id: 'container--7666',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--7666',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--312', 'text--5676'],
                },
            },
        },
        'text--2675': {
            id: 'text--2675',
            widget: 'text',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Request Catalog Items?',
                variant: 'p',
                route: 'text--2675',
            },
            listeners: {},
            slots: {},
        },
        'checkbox--3303': {
            id: 'checkbox--3303',
            widget: 'checkbox',
            parent: {
                id: 'container--3469',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: true,
                route: 'checkbox--3303',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--3469': {
            id: 'container--3469',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--3469',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--3303', 'text--2036'],
                },
            },
        },
        'text--2036': {
            id: 'text--2036',
            widget: 'text',
            parent: {
                id: 'container--3469',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Having trouble finding the item you need?',
                variant: 'p',
                route: 'text--2036',
            },
            listeners: {},
            slots: {},
        },
        'text--312': {
            id: 'text--312',
            widget: 'text',
            parent: {
                id: 'container--7666',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Required fields are marked with an asterisk (*).',
                variant: 'p',
                route: 'text--312',
            },
            listeners: {},
            slots: {},
        },
        'text--5676': {
            id: 'text--5676',
            widget: 'text',
            parent: {
                id: 'container--7666',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'If a station needs an item from the RRC and it is not requestable but shows there is inventory available, the requestor should request the item(s) by sending an email through the VISN CLO requesting the item. The request should be sent to the OPRCOVID19WAREHOUSEPLANNING@va.gov email group. The request should include the Station Number, the requested quantity, and justification of why the RRC is the only source of supply for this item, and cerification from the requestor that MSPV is unable to fulfill the request.',
                variant: 'p',
                route: 'text--5676',
            },
            listeners: {},
            slots: {},
        },
        'container--1825': {
            id: 'container--1825',
            widget: 'container',
            parent: {
                id: 'container--6796',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bababa',
                },
                route: 'container--1825',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--6300',
                        'container--9157',
                        'select--4654',
                        'select--9999',
                        'select--2432',
                        'input--1442',
                        'input--3871',
                        'input--8437',
                        'input--3250',
                        'input--8276',
                        'container--5364',
                        'container--9899',
                        'container--6606',
                        'container--1786',
                        'input--4199',
                        'input--3792',
                        'input--8693',
                        'text--4053',
                        'container--5656',
                    ],
                },
            },
        },
        'text--6300': {
            id: 'text--6300',
            widget: 'text',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Allow Substitute? Can this item be substituted with a clinically equivalent item?',
                variant: 'p',
                route: 'text--6300',
            },
            listeners: {},
            slots: {},
        },
        'container--4086': {
            id: 'container--4086',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    border: '1px solid #c9c9c9',
                },
                route: 'container--4086',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--2207',
                        'container--1154',
                        'container--6796',
                    ],
                },
            },
        },
        'text--2207': {
            id: 'text--2207',
            widget: 'text',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{selected_item}}',
                variant: 'p',
                route: 'text--2207',
            },
            listeners: {},
            slots: {},
        },
        'text--8522': {
            id: 'text--8522',
            widget: 'text',
            parent: {
                id: 'container--1804',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Date Needed:',
                variant: 'p',
                route: 'text--8522',
            },
            listeners: {},
            slots: {},
        },
        'container--1154': {
            id: 'container--1154',
            widget: 'container',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '120px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                },
                route: 'container--1154',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'container--1804',
                        'container--7610',
                        'container--6430',
                    ],
                },
            },
        },
        'checkbox--4625': {
            id: 'checkbox--4625',
            widget: 'checkbox',
            parent: {
                id: 'container--9157',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: true,
                route: 'checkbox--4625',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--9157': {
            id: 'container--9157',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--9157',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--4625', 'text--2272'],
                },
            },
        },
        'text--2272': {
            id: 'text--2272',
            widget: 'text',
            parent: {
                id: 'container--9157',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{allowSub}}',
                variant: 'p',
                route: 'text--2272',
            },
            listeners: {},
            slots: {},
        },
        'select--4654': {
            id: 'select--4654',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Group',
                hint: 'eg. DIALYSIS, PPE. This is a required field',
                options: '{{groups.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                route: 'select--4654',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--9999': {
            id: 'select--9999',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Category',
                hint: 'e.g. BACTERIAL SPRAY, GLOVE. This is a required field.',
                options: '{{categories.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                route: 'select--9999',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--2432': {
            id: 'select--2432',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Item',
                hint: 'e.g. N95 MASK, SURGICAL GOWN. This is a required field.',
                options: '{{items.output}}',
                required: false,
                disabled: false,
                loading: '{{get_request_options.isLoading}}',
                route: 'select--2432',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_item_details',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--1442': {
            id: 'input--1442',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{manu_name}}',
                label: 'Manufacturer Name',
                hint: 'This is a required field and has a maximum character limit of 50 characters.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--1442',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3871': {
            id: 'input--3871',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Manufacturer UEI',
                hint: "The manufacturer UEI must be 12 characters, alphanumeric (excluding the characters 'O' and 'I').",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3871',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8437': {
            id: 'input--8437',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{manu_duns}}',
                label: 'Manufacturer DUNS',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--8437',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3250': {
            id: 'input--3250',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{oem_part_num}}',
                label: 'OEM Part Number',
                hint: 'Please enter OEM Part Number.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3250',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8276': {
            id: 'input--8276',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{size}}',
                label: 'Size Needed',
                hint: 'e.g. Small, Medium, Large, One-Size.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--8276',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--13': {
            id: 'input--13',
            widget: 'input',
            parent: {
                id: 'container--9582',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{uop}}',
                label: 'Unit of Purchase',
                hint: 'e.g. BOX, CASE, CONTAINER, DOZEN.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--13',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3682': {
            id: 'input--3682',
            widget: 'input',
            parent: {
                id: 'container--5601',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{pallet_size}}',
                label: 'Approximate Pallet Size',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3682',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5364': {
            id: 'container--5364',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--5364',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--9582', 'container--5601'],
                },
            },
        },
        'container--9582': {
            id: 'container--9582',
            widget: 'container',
            parent: {
                id: 'container--5364',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--9582',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--13'],
                },
            },
        },
        'container--5601': {
            id: 'container--5601',
            widget: 'container',
            parent: {
                id: 'container--5364',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--5601',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--3682'],
                },
            },
        },
        'input--163': {
            id: 'input--163',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{count_uop}}',
                label: 'Packaging Multiple',
                hint: 'This is the number of eaches within one unit of purchase. This field has a minimum value of 0.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--163',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--9695': {
            id: 'container--9695',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--9695',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--163'],
                },
            },
        },
        'input--2266': {
            id: 'input--2266',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{total_eaches_needed}}',
                label: 'Total Eaches Needed',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{cal_sheet.isLoading}}',
                route: 'input--2266',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5555': {
            id: 'container--5555',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--5555',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--2266'],
                },
            },
        },
        'container--9899': {
            id: 'container--9899',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--9899',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--9695', 'container--5555'],
                },
            },
        },
        'input--7831': {
            id: 'input--7831',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{cost}}',
                label: 'Price',
                hint: 'Please enter a price for the item.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--7831',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--6306': {
            id: 'container--6306',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--6306',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--7831'],
                },
            },
        },
        'input--6164': {
            id: 'input--6164',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{price}}',
                label: 'Item Cost',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: '{{cal_sheet.isLoading}}',
                route: 'input--6164',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--2614': {
            id: 'container--2614',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--2614',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--6164'],
                },
            },
        },
        'container--6606': {
            id: 'container--6606',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--6606',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--6306', 'container--2614'],
                },
            },
        },
        'input--4199': {
            id: 'input--4199',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '1',
                label: 'Quantity of UOP Needed',
                hint: "This is the quantity of 'Unit of Purchase' needed. Quantity must be greater than 0.",
                type: 'number',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--4199',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'calculate_item_values',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3792': {
            id: 'input--3792',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{critical_level}}',
                label: 'Critical Item Level',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: 'true',
                required: false,
                loading: false,
                route: 'input--3792',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8693': {
            id: 'input--8693',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '2025-02-08',
                label: 'Date Needed',
                hint: 'Please select a date that is in the future.',
                type: 'date',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--8693',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5656': {
            id: 'container--5656',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--5656',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--9484', 'text--7412'],
                },
            },
        },
        'checkbox--9484': {
            id: 'checkbox--9484',
            widget: 'checkbox',
            parent: {
                id: 'container--5656',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: false,
                route: 'checkbox--9484',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'text--7412': {
            id: 'text--7412',
            widget: 'text',
            parent: {
                id: 'container--5656',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{isSurgery}}',
                variant: 'p',
                route: 'text--7412',
            },
            listeners: {},
            slots: {},
        },
        'text--4053': {
            id: 'text--4053',
            widget: 'text',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Will this be used for surgery?',
                variant: 'p',
                route: 'text--4053',
            },
            listeners: {},
            slots: {},
        },
        'container--6796': {
            id: 'container--6796',
            widget: 'container',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '16px',
                    flexWrap: 'wrap',
                    backgroundColor: '#fef9f4',
                },
                route: 'container--6796',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--1825'],
                },
            },
        },
        'text--3101': {
            id: 'text--3101',
            widget: 'text',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date:',
                variant: 'p',
                route: 'text--3101',
            },
            listeners: {},
            slots: {},
        },
        'text--727': {
            id: 'text--727',
            widget: 'text',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date:',
                variant: 'p',
                route: 'text--727',
            },
            listeners: {},
            slots: {},
        },
        'container--4028': {
            id: 'container--4028',
            widget: 'container',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    overflow: 'scroll',
                    width: '100%',
                },
                route: 'container--4028',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--5853'],
                },
            },
        },
        'container--4447': {
            id: 'container--4447',
            widget: 'container',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    position: 'sticky',
                    top: 0,
                    zIndex: 10,
                    width: '100%',
                    border: '0px  #ffffff',
                    height: '90px',
                    backgroundColor: '#003e73',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '24px',
                },
                route: 'container--4447',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['image--6595', 'text--7053'],
                },
            },
        },
        'image--6595': {
            id: 'image--6595',
            widget: 'image',
            parent: {
                id: 'container--4447',
                slot: 'children',
            },
            data: {
                src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/US_Department_of_Veterans_Affairs_logo.svg/2560px-US_Department_of_Veterans_Affairs_logo.svg.png',
                style: {
                    alignItems: 'center',
                    display: 'flex',
                    width: '300px',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'top center',
                    backgroundRepeat: 'no-repeat',
                    justifyContent: 'center',
                    height: '65px',
                },
                title: '',
                route: 'image--6595',
            },
            listeners: {},
            slots: {},
        },
        'text--7053': {
            id: 'text--7053',
            widget: 'text',
            parent: {
                id: 'container--4447',
                slot: 'children',
            },
            data: {
                variant: 'h1',
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ffffff',
                },
                text: 'National Contingency Response Tool',
                route: 'text--7053',
            },
            listeners: {},
            slots: {},
        },
        'text--774': {
            id: 'text--774',
            widget: 'text',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: '{{inv_date}}',
                variant: 'p',
                route: 'text--774',
            },
            listeners: {},
            slots: {},
        },
        'text--8665': {
            id: 'text--8665',
            widget: 'text',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: '{{inv_date}}',
                variant: 'p',
                route: 'text--8665',
            },
            listeners: {},
            slots: {},
        },
        'container--6731': {
            id: 'container--6731',
            widget: 'container',
            parent: {
                id: 'container--1786',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    width: '48%',
                    border: '0px  ',
                },
                route: 'container--6731',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--5431', 'text--3101', 'text--8665'],
                },
            },
        },
        'container--6144': {
            id: 'container--6144',
            widget: 'container',
            parent: {
                id: 'container--1786',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    width: '48%',
                    border: '0px  ',
                },
                route: 'container--6144',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--2038', 'text--727', 'text--774'],
                },
            },
        },
        'input--5431': {
            id: 'input--5431',
            widget: 'input',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                hint: "Warehouse's requestable quantity of 'Eaches' for the product requested.",
                multiline: false,
                style: {
                    padding: '4px',
                    width: '100%',
                },
                disabled: 'true',
                label: 'Requestable Quantity',
                type: 'text',
                rows: 1,
                loading: '{{get_item_dets_sheet.isLoading}}',
                value: '{{REQ_QUANT_UOP}}',
                required: false,
                route: 'input--5431',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--2038': {
            id: 'input--2038',
            widget: 'input',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                hint: "Warehouse's quantity on hand of 'Eaches' for the product requested.",
                multiline: false,
                style: {
                    padding: '4px',
                    width: '100%',
                },
                disabled: 'true',
                label: 'Quantity on Hand (Eaches)',
                type: 'text',
                rows: 1,
                loading: '{{get_item_dets_sheet.isLoading}}',
                value: '{{req_quant_ea}}',
                required: false,
                route: 'input--2038',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--1786': {
            id: 'container--1786',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--1786',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--6731', 'container--6144'],
                },
            },
        },
        'container--1804': {
            id: 'container--1804',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--1804',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--8522', 'text--7629'],
                },
            },
        },
        'text--7629': {
            id: 'text--7629',
            widget: 'text',
            parent: {
                id: 'container--1804',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{date_needed}}',
                variant: 'p',
                route: 'text--7629',
            },
            listeners: {},
            slots: {},
        },
        'text--4742': {
            id: 'text--4742',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Quantity of UOP:',
                variant: 'p',
                route: 'text--4742',
            },
            listeners: {},
            slots: {},
        },
        'text--2808': {
            id: 'text--2808',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{quant_uop_needed}}',
                variant: 'p',
                route: 'text--2808',
            },
            listeners: {},
            slots: {},
        },
        'container--7610': {
            id: 'container--7610',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--7610',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--4742', 'text--2808'],
                },
            },
        },
        'text--9340': {
            id: 'text--9340',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Size Needed:',
                variant: 'p',
                route: 'text--9340',
            },
            listeners: {},
            slots: {},
        },
        'text--9865': {
            id: 'text--9865',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: ' {{size}} ',
                variant: 'p',
                route: 'text--9865',
            },
            listeners: {},
            slots: {},
        },
        'container--6430': {
            id: 'container--6430',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--6430',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--9340', 'text--9865'],
                },
            },
        },
        'text--6404': {
            id: 'text--6404',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                variant: 'h6',
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                },
                text: '{{submit_message}}',
                route: 'text--6404',
            },
            listeners: {},
            slots: {},
        },
        'text--2475': {
            id: 'text--2475',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'New Supplies Request',
                variant: 'h1',
                route: 'text--2475',
            },
            listeners: {},
            slots: {},
        },
        'text--5029': {
            id: 'text--5029',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 1: Enter VISN Details',
                variant: 'h2',
                route: 'text--5029',
            },
            listeners: {},
            slots: {},
        },
        'text--7699': {
            id: 'text--7699',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 2: Enter Shipping Details',
                variant: 'h2',
                route: 'text--7699',
            },
            listeners: {},
            slots: {},
        },
        'text--7466': {
            id: 'text--7466',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 3: Enter Item Details',
                variant: 'h2',
                route: 'text--7466',
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {
        selected_visn: {
            type: 'block',
            to: 'select--4306',
        },
        selected_station: {
            type: 'block',
            to: 'select--6283',
        },
        ncrt_db_id: {
            type: 'string',
            value: 'fe5e2c23-59e6-42ae-939d-b2ca9699f38c',
        },
        selected_group: {
            type: 'block',
            to: 'select--4654',
        },
        selected_category: {
            type: 'block',
            to: 'select--9999',
        },
        selected_item: {
            type: 'block',
            to: 'select--2432',
        },
        get_request_options: {
            type: 'query',
            to: 'get_request_options',
        },
        visns: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '30014',
        },
        stations: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '67063',
        },
        facilities: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '28365',
        },
        groups: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '77120',
        },
        categories: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '49665',
        },
        items: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '9881',
        },
        pixel_call: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '96686',
        },
        unformatted_item_dets: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '51981',
        },
        manu_name: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '41113',
        },
        manu_duns: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '76103',
        },
        oem_part_num: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '29237',
        },
        size: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '23418',
        },
        uop: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '28529',
        },
        pallet_size: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '87532',
        },
        cost: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '14083',
        },
        REQ_QUANT_UOP: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '89358',
        },
        req_quant_ea: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '16171',
        },
        inv_date: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '6290',
        },
        count_uop: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '31712',
        },
        quant_uop_needed: {
            type: 'block',
            to: 'input--4199',
        },
        price: {
            type: 'cell',
            to: 'calculate_item_values',
            cellId: '72814',
        },
        total_eaches_needed: {
            type: 'cell',
            to: 'calculate_item_values',
            cellId: '88277',
        },
        critical_level: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '86478',
        },
        isSurgery: {
            type: 'block',
            to: 'checkbox--9484',
        },
        allowSub: {
            type: 'block',
            to: 'checkbox--4625',
        },
        date_needed: {
            type: 'block',
            to: 'input--8693',
        },
        name: {
            type: 'block',
            to: 'input--7344',
        },
        phone_num: {
            type: 'block',
            to: 'input--9160',
        },
        phone_ext: {
            type: 'block',
            to: 'input--5159',
        },
        email: {
            type: 'block',
            to: 'input--413',
        },
        item_type: {
            type: 'block',
            to: 'radio--5298',
        },
        add_info: {
            type: 'block',
            to: 'input--3977',
        },
        vha_mission: {
            type: 'block',
            to: 'checkbox--1671',
        },
        selected_facility: {
            type: 'block',
            to: 'select--1578',
        },
        java_submit_obj: {
            type: 'cell',
            to: 'submit_request',
            cellId: '53064',
        },
        fac_info: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '67337',
        },
        ncrtShipId: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '45406',
        },
        addy: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '85694',
        },
        item_desc: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '3521',
        },
        is_cat_item: {
            type: 'block',
            to: 'checkbox--3303',
        },
        'sub_req-sheet': {
            type: 'query',
            to: 'submit_request',
        },
        submit_message: {
            type: 'cell',
            to: 'submit_request',
            cellId: '20430',
        },
        get_item_dets_sheet: {
            type: 'query',
            to: 'get_item_details',
        },
        cal_sheet: {
            type: 'query',
            to: 'calculate_item_values',
        },
    },
    executionOrder: [
        'submit_request',
        'get_request_options',
        'get_item_details',
        'calculate_item_values',
    ],
    version: '1.0.0-alpha.4',
};

const s: SerializedState = {
    queries: {
        submit_request: {
            id: 'submit_request',
            cells: [
                {
                    id: '53064',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: '{\r\n    "VISN":"{{selected_visn}}",\r\n    "STATION":"{{selected_station}}",\r\n    "FACILITY_ID":"{{selected_facility}}",\r\n    "IFCAP_PO":"",\r\n    "TOTAL_COST":{{price}},\r\n    "REQUEST_TYPE":"{{item_type}}",\r\n    "SHIP_NAME": "{{name}}",\r\n    "SHIP_PHONE":"{{phone_num}}",\r\n    "SHIP_PHONE_EXTENSION":"{{phone_num}}",\r\n    "SHIP_EMAIL":"{{email}}",\r\n    "ADD_INSTRUCTIONS":"{{add_info}}",\r\n    "NCRT_SHIP_ID":"{{ncrtShipId}}",\r\n    "SHIP_ADDRESS": "{{addy}}",\r\n    "VHA_4TH_MISSION": false,\r\n    "IS_CATALOG_REQUEST": true,\r\n    "items": [\r\n    {\r\n        "VSSC_GROUP": "{{selected_group}}",\r\n        "VSSC_CATEGORY":"{{selected_category}}",\r\n        "SIZE_NEEDED": "{{size}}",\r\n        "QUANTITY_REQUESTED": {{quant_uop_needed}},\r\n        "UOP":"{{uop}}",\r\n        "ITEM_DESCRIPTION":"{{item_desc}}",\r\n        "COUNT_UOP":{{count_uop}},\r\n        "COST_UOP":{{cost}},\r\n        "TOTAL_ITEM_COST":{{price}},\r\n        "ITEM_TYPE":"{{selected_item}}",\r\n        "MANUFACTURER_NAME":"{{manu_name}}",\r\n        "OEM_PART_NUMBER": "{{oem_part_num}}",\r\n        "IS_CATALOG_ITEM":{{is_cat_item}},\r\n        "IS_SURGICAL":{{isSurgery}},\r\n        "ITEM_SUB_ALLOWED":{{allowSub}},\r\n\r\n        "DATE_NEEDED":"2025-02-14",\r\n        "MANUFACTURER_DUNS":"",\r\n        "MANUFACTURER_UEI": "",\r\n        "REQUEST_ITEM_COMMENT":"",\r\n        "EQUIPMENT_SEPG":"",\r\n        "accessories":[]\r\n\r\n    }\r\n    ]\r\n}',
                    },
                },
                {
                    id: '77529',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: 'SubmitRequest(database=["{{ncrt_db_id}}"], map=[{{java_submit_obj}}]);',
                    },
                },
                {
                    id: '83416',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '# "SUBMIT REQUEST HAS GONE THROUGH"',
                    },
                },
                {
                    id: '20430',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: '{{java_submit_obj}}',
                    },
                },
            ],
        },
        get_request_options: {
            id: 'get_request_options',
            cells: [
                {
                    id: '96686',
                    widget: 'code',
                    parameters: {
                        code: 'from semoss import Insight\r\ninsight = Insight(insight_id = \'${i}\')\r\n\r\nfacility_list = insight.run_pixel("GetRequestFacilities();")\r\n\r\nrequestable_item_info = insight.run_pixel("GetRequestableItemInfo(filters=[Filter((CATALOG__CATALOG_TYPE == \'COMMODITY\'))]);")\r\n\r\npixelResult = {\r\n    "items": requestable_item_info,\r\n    "facilities": facility_list\r\n}\r\n\r\npixelResult',
                        type: 'py',
                    },
                },
                {
                    id: '30014',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'facility_list\r\n\r\nvisns = list(facility_list.keys())\r\n\r\nvisns',
                    },
                },
                {
                    id: '67063',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'selected_v = "{{selected_visn}}"\r\nprint("p", selected_v)\r\n\r\nstations = []\r\n\r\nif selected_v is not None and selected_v != \'undefined\' and selected_v != \'\':\r\n    stations = list(facility_list[selected_v].keys())\r\n\r\nstations',
                    },
                },
                {
                    id: '28365',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_s = \"{{selected_station}}\"\r\nprint(selected_s)\r\n\r\nfacilities = []\r\n\r\nif selected_s is not None and selected_s != 'undefined' and selected_s != '': \r\n    facilities = list(facility_list[selected_v][selected_s].keys())\r\n\r\nfacilities",
                    },
                },
                {
                    id: '67337',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nselected_v = "{{selected_visn}}"\r\nselected_s = "{{selected_station}}"\r\nselected_f = "{{selected_facility}}"\r\n\r\nselected_facility_info = {}\r\n\r\nif (selected_v is not None and selected_v != \'undefined\' and selected_v != \'\' and\r\n    selected_s is not None and selected_s != \'undefined\' and selected_s != \'\' and\r\n    selected_f is not None and selected_f != \'undefined\' and selected_f != \'\'):\r\n    print(\'hey\')\r\n    fac = json.loads("""{{pixel_call}}""")\r\n    selected_facility_info = fac["facilities"]["{{selected_visn}}"]["{{selected_station}}"]["{{selected_facility}}"][0]\r\n\r\nselected_facility_info',
                    },
                },
                {
                    id: '45406',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'print({{fac_info}})\r\nncrtShipId = ""\r\n\r\nif ({{fac_info}} and len({{fac_info}}) > 0):\r\n    ncrtShipId = {{fac_info}}["ncrtShipId"]\r\n\r\nncrtShipId',
                    },
                },
                {
                    id: '85694',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'addy = \'\'\r\nif ({{fac_info}} and len({{fac_info}}) > 0):\r\n    addy = {{fac_info}}["address"]\r\n\r\naddy',
                    },
                },
                {
                    id: '65652',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '"-------------------------------------------------------"',
                    },
                },
                {
                    id: '77120',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'requestable_item_info\r\n\r\ngroups = list(requestable_item_info.keys())\r\n\r\ngroups',
                    },
                },
                {
                    id: '49665',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_g = \"{{selected_group}}\"\r\n\r\ncategories = []\r\n\r\nif selected_g is not None and selected_g != 'undefined' and selected_g != '':\r\n    categories = list(requestable_item_info[selected_g].keys())\r\n\r\ncategories",
                    },
                },
                {
                    id: '9881',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: "selected_c = \"{{selected_category}}\"\r\n\r\nitms = []\r\n\r\nif selected_c is not None and selected_c != 'undefined' and selected_c != '':\r\n    itms = list(requestable_item_info[selected_g][selected_c].keys())\r\n\r\nitms",
                    },
                },
            ],
        },
        get_item_details: {
            id: 'get_item_details',
            cells: [
                {
                    id: '15361',
                    widget: 'code',
                    parameters: {
                        code: 'import json \r\n\r\nparsed = json.loads("""{{pixel_call}}""")\r\n\r\nparsed',
                        type: 'py',
                    },
                },
                {
                    id: '58510',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'item_info = parsed["items"]["{{selected_group}}"]["{{selected_category}}"]["{{selected_item}}"]',
                    },
                },
                {
                    id: '51981',
                    widget: 'code',
                    parameters: {
                        type: 'pixel',
                        code: 'GetCatalogItems(filters=[Filter(CATALOG__ITEM_TYPE==["{{selected_item}}"])]);',
                    },
                },
                {
                    id: '41113',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["MANUFACTURER_NAME"]',
                    },
                },
                {
                    id: '76103',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["MANUFACTURER_DUNS"]',
                    },
                },
                {
                    id: '23418',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["SIZE"]',
                    },
                },
                {
                    id: '28529',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["UOP"]',
                    },
                },
                {
                    id: '87532',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["APPROX_PALLET_SIZE"]',
                    },
                },
                {
                    id: '3521',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["ITEM_DESCRIPTION"]',
                    },
                },
                {
                    id: '29237',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["OEM_PART_NUMBER"]',
                    },
                },
                {
                    id: '14083',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["COST_UOP"]',
                    },
                },
                {
                    id: '89358',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["REQUESTABLE_QTY_CASES"]',
                    },
                },
                {
                    id: '16171',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["REQUESTABLE_QTY_EA"]',
                    },
                },
                {
                    id: '6290',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["INVENTORY_DATE"]',
                    },
                },
                {
                    id: '31712',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["COUNT_UOP"]',
                    },
                },
                {
                    id: '86478',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: 'import json \r\n\r\nparsedDets = json.loads("""{{unformatted_item_dets}}""")\r\n\r\nparsedDets[0]["CRITICAL_INVENTORY_LEVEL"]',
                    },
                },
            ],
        },
        calculate_item_values: {
            id: 'calculate_item_values',
            cells: [
                {
                    id: '72814',
                    widget: 'code',
                    parameters: {
                        code: '{{quant_uop_needed}} * {{cost}}',
                        type: 'py',
                    },
                },
                {
                    id: '88277',
                    widget: 'code',
                    parameters: {
                        type: 'py',
                        code: '{{quant_uop_needed}} * {{count_uop}}',
                    },
                },
            ],
        },
    },
    blocks: {
        'page-1': {
            slots: {
                content: {
                    children: ['container--4447', 'container--4028'],
                    name: 'content',
                },
            },
            widget: 'page',
            data: {
                style: {
                    padding: '0px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: '#f8f8f9',
                },
                route: '',
                loading: '{{get_request_options.isLoading}}',
            },
            listeners: {
                onPageLoad: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            id: 'page-1',
        },
        'container--5853': {
            id: 'container--5853',
            widget: 'container',
            parent: {
                id: 'container--4028',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '24px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    margin: '48px',
                },
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--5866',
                        'text--2934',
                        'text--4172',
                        'markdown--3077',
                        'text--7706',
                        'container--718',
                        'text--5695',
                        'container--5946',
                        'text--3947',
                        'container--4934',
                        'container--5755',
                        'text--6404',
                    ],
                },
            },
        },
        'text--2934': {
            id: 'text--2934',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Use this section to request critical supplies, including Personal Protective Equipment (PPE).',
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'text--4172': {
            id: 'text--4172',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: "VA Facilities should maintain the appropriate levels of emergency supplies (e.g., PPE) per applicable VA regulations. This request portal should be completed by Facility CSCOs when there is a critical need for supplies and all attempts to leverage the established cupply chain channels have been unsuccessful. For example, if the Prime Vendor cannot honor a facility's order for the PPE items.",
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'markdown--3077': {
            id: 'markdown--3077',
            widget: 'markdown',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                markdown: '---',
            },
            listeners: {},
            slots: {},
        },
        'text--5866': {
            id: 'text--5866',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'New Supplies Request',
                variant: 'h3',
            },
            listeners: {},
            slots: {},
        },
        'container--718': {
            id: 'container--718',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--8664',
                        'select--4306',
                        'select--6283',
                        'select--1578',
                        'radio--5298',
                        'container--8402',
                    ],
                },
            },
        },
        'text--8664': {
            id: 'text--8664',
            widget: 'text',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Required fields are marked with an asterisk (*).',
                variant: 'p',
            },
            listeners: {},
            slots: {},
        },
        'text--7706': {
            id: 'text--7706',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 1: Enter VISN Details',
                variant: 'h5',
            },
            listeners: {},
            slots: {},
        },
        'select--4306': {
            id: 'select--4306',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'VISN',
                hint: '',
                options: '{{visns.output}}',
                required: false,
                disabled: false,
                loading: false,
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--6283': {
            id: 'select--6283',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'STATION',
                hint: '',
                options: '{{stations.output}}',
                required: false,
                disabled: false,
                loading: false,
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--1578': {
            id: 'select--1578',
            widget: 'select',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'FACILITY',
                hint: '',
                options: '{{facilities.output}}',
                required: false,
                disabled: false,
                loading: false,
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'radio--5298': {
            id: 'radio--5298',
            widget: 'radio',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                value: 'COMMODITY',
                label: "Please select an option for the request's type *",
                isGroup: false,
                options: [
                    {
                        label: 'Commodities',
                        value: 'COMMODITY',
                    },
                    {
                        label: 'Equipment',
                        value: 'EQUIPMENT',
                    },
                ],
                size: 'medium',
                direction: 'column',
                color: 'primary',
                labelPlacement: 'end',
                required: false,
                disabled: false,
                route: 'radio--5298',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'checkbox--1671': {
            id: 'checkbox--1671',
            widget: 'checkbox',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: false,
                route: 'checkbox--1671',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--8402': {
            id: 'container--8402',
            widget: 'container',
            parent: {
                id: 'container--718',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    justifyContent: 'left',
                    alignItems: 'center',
                },
                route: 'container--8402',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--1671', 'text--576', 'input--4004'],
                },
            },
        },
        'text--576': {
            id: 'text--576',
            widget: 'text',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'I confirm all the items within this request will be used in support of the VHA 4th Mission Objectives',
                variant: 'p',
                route: 'text--576',
            },
            listeners: {},
            slots: {},
        },
        'input--4004': {
            id: 'input--4004',
            widget: 'input',
            parent: {
                id: 'container--8402',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Zero Cost PO (optional)',
                hint: "Please create a 'Zero Cost' Purchase Order within IFCAP when requesting an order in the NCRT and provide the associated purchase order number. (0/50)",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--4004',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5946': {
            id: 'container--5946',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
                route: 'container--5946',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'input--7344',
                        'button--8309',
                        'input--8432',
                        'input--3977',
                        'input--9160',
                        'input--5159',
                        'input--413',
                    ],
                },
            },
        },
        'text--5695': {
            id: 'text--5695',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 2: Enter Shipping Details',
                variant: 'h5',
                route: 'text--5695',
            },
            listeners: {},
            slots: {},
        },
        'input--7344': {
            id: 'input--7344',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'June',
                label: 'Name',
                hint: ' Please enter a name for the shipping address of 50 characters or less. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--7344',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8432': {
            id: 'input--8432',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{addy}}',
                label: 'Address',
                hint: 'If you cannot find the address you would like to ship to, please contact your facility Chief Logistics Officer and ask that they complete an AAC Requestopens in a new tab.This will enable your Chief Supply Chain Officer to create or update an AAC address. Once the location has an ACC code created (or is updated), please alert your Customer Service Representative, so that the address can be added to the NCRT tool.',
                type: 'text',
                rows: '3',
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--8432',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3977': {
            id: 'input--3977',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'info',
                label: 'Additional Info',
                hint: 'Please do not include PII or PHI in this field. Also, this field has a maximum character limit of 500. (0/500)',
                type: 'text',
                rows: '3',
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--3977',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--9160': {
            id: 'input--9160',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '7032211212',
                label: 'Phone Number',
                hint: ' Enter a valid phone number.. Please enter as ##########',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--9160',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--5159': {
            id: 'input--5159',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '1',
                label: 'Extension',
                hint: 'Extension has a maximum character limit of 50. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--5159',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--413': {
            id: 'input--413',
            widget: 'input',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: 'jbax@gmail.com',
                label: 'Email',
                hint: ' Email address has a maximum character limit of 50. (0/50)',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--413',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'button--8309': {
            id: 'button--8309',
            widget: 'button',
            parent: {
                id: 'container--5946',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'View Other Adresses',
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
                route: 'button--8309',
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        'container--4934': {
            id: 'container--4934',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '16px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #000000',
                },
                route: 'container--4934',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'container--7666',
                        'text--2675',
                        'container--3469',
                        'container--4086',
                    ],
                },
            },
        },
        'button--7279': {
            id: 'button--7279',
            widget: 'button',
            parent: {
                id: 'container--5755',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'Reset',
                loading: false,
                disabled: false,
                variant: 'outlined',
                color: 'primary',
                route: 'button--7279',
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        'button--4571': {
            id: 'button--4571',
            widget: 'button',
            parent: {
                id: 'container--5755',
                slot: 'children',
            },
            data: {
                style: {},
                label: 'Submit',
                loading: '{{sub_req-sheet.isLoading}}',
                disabled: false,
                variant: 'contained',
                color: 'primary',
                route: 'button--4571',
            },
            listeners: {
                onClick: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'submit_request',
                        },
                    },
                ],
            },
            slots: {},
        },
        'container--5755': {
            id: 'container--5755',
            widget: 'container',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    border: '1px solid #ffffff',
                    justifyContent: 'center',
                    alignItems: 'center',
                },
                route: 'container--5755',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['button--7279', 'button--4571'],
                },
            },
        },
        'text--3947': {
            id: 'text--3947',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Step 3: Enter Item Details',
                variant: 'h5',
                route: 'text--3947',
            },
            listeners: {},
            slots: {},
        },
        'container--7666': {
            id: 'container--7666',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--7666',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--312', 'text--5676'],
                },
            },
        },
        'text--2675': {
            id: 'text--2675',
            widget: 'text',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Request Catalog Items?',
                variant: 'p',
                route: 'text--2675',
            },
            listeners: {},
            slots: {},
        },
        'checkbox--3303': {
            id: 'checkbox--3303',
            widget: 'checkbox',
            parent: {
                id: 'container--3469',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: true,
                route: 'checkbox--3303',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--3469': {
            id: 'container--3469',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--3469',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--3303', 'text--2036'],
                },
            },
        },
        'text--2036': {
            id: 'text--2036',
            widget: 'text',
            parent: {
                id: 'container--3469',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Having trouble finding the item you need?',
                variant: 'p',
                route: 'text--2036',
            },
            listeners: {},
            slots: {},
        },
        'text--312': {
            id: 'text--312',
            widget: 'text',
            parent: {
                id: 'container--7666',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Required fields are marked with an asterisk (*).',
                variant: 'p',
                route: 'text--312',
            },
            listeners: {},
            slots: {},
        },
        'text--5676': {
            id: 'text--5676',
            widget: 'text',
            parent: {
                id: 'container--7666',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'If a station needs an item from the RRC and it is not requestable but shows there is inventory available, the requestor should request the item(s) by sending an email through the VISN CLO requesting the item. The request should be sent to the OPRCOVID19WAREHOUSEPLANNING@va.gov email group. The request should include the Station Number, the requested quantity, and justification of why the RRC is the only source of supply for this item, and cerification from the requestor that MSPV is unable to fulfill the request.',
                variant: 'p',
                route: 'text--5676',
            },
            listeners: {},
            slots: {},
        },
        'container--1825': {
            id: 'container--1825',
            widget: 'container',
            parent: {
                id: 'container--6796',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    border: '1px solid #bababa',
                },
                route: 'container--1825',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--6300',
                        'container--9157',
                        'select--4654',
                        'select--9999',
                        'select--2432',
                        'input--1442',
                        'input--3871',
                        'input--8437',
                        'input--3250',
                        'input--8276',
                        'container--5364',
                        'container--9899',
                        'container--6606',
                        'container--1786',
                        'input--4199',
                        'input--3792',
                        'input--8693',
                        'text--4053',
                        'container--5656',
                    ],
                },
            },
        },
        'text--6300': {
            id: 'text--6300',
            widget: 'text',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Allow Substitute? Can this item be substituted with a clinically equivalent item?',
                variant: 'p',
                route: 'text--6300',
            },
            listeners: {},
            slots: {},
        },
        'container--4086': {
            id: 'container--4086',
            widget: 'container',
            parent: {
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    border: '1px solid #c9c9c9',
                },
                route: 'container--4086',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'text--2207',
                        'container--1154',
                        'container--6796',
                    ],
                },
            },
        },
        'text--2207': {
            id: 'text--2207',
            widget: 'text',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{selected_item}}',
                variant: 'p',
                route: 'text--2207',
            },
            listeners: {},
            slots: {},
        },
        'text--8522': {
            id: 'text--8522',
            widget: 'text',
            parent: {
                id: 'container--1804',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Date Needed:',
                variant: 'p',
                route: 'text--8522',
            },
            listeners: {},
            slots: {},
        },
        'container--1154': {
            id: 'container--1154',
            widget: 'container',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '120px',
                    flexWrap: 'wrap',
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                },
                route: 'container--1154',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: [
                        'container--1804',
                        'container--7610',
                        'container--6430',
                    ],
                },
            },
        },
        'checkbox--4625': {
            id: 'checkbox--4625',
            widget: 'checkbox',
            parent: {
                id: 'container--9157',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: true,
                route: 'checkbox--4625',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'container--9157': {
            id: 'container--9157',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--9157',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--4625', 'text--2272'],
                },
            },
        },
        'text--2272': {
            id: 'text--2272',
            widget: 'text',
            parent: {
                id: 'container--9157',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{allowSub}}',
                variant: 'p',
                route: 'text--2272',
            },
            listeners: {},
            slots: {},
        },
        'select--4654': {
            id: 'select--4654',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Group',
                hint: 'eg. DIALYSIS, PPE. This is a required field',
                options: '{{groups.output}}',
                required: false,
                disabled: false,
                loading: false,
                route: 'select--4654',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--9999': {
            id: 'select--9999',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Category',
                hint: 'e.g. BACTERIAL SPRAY, GLOVE. This is a required field.',
                options: '{{categories.output}}',
                required: false,
                disabled: false,
                loading: false,
                route: 'select--9999',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_request_options',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'select--2432': {
            id: 'select--2432',
            widget: 'select',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                },
                label: 'Item',
                hint: 'e.g. N95 MASK, SURGICAL GOWN. This is a required field.',
                options: '{{items.output}}',
                required: false,
                disabled: false,
                loading: false,
                route: 'select--2432',
                optionLabel: '',
                optionSublabel: '',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'get_item_details',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--1442': {
            id: 'input--1442',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{manu_name}}',
                label: 'Manufacturer Name',
                hint: 'This is a required field and has a maximum character limit of 50 characters.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--1442',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3871': {
            id: 'input--3871',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Manufacturer UEI',
                hint: "The manufacturer UEI must be 12 characters, alphanumeric (excluding the characters 'O' and 'I').",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3871',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8437': {
            id: 'input--8437',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{manu_duns}}',
                label: 'Manufacturer DUNS',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--8437',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3250': {
            id: 'input--3250',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{oem_part_num}}',
                label: 'OEM Part Number',
                hint: 'Please enter OEM Part Number.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3250',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8276': {
            id: 'input--8276',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{size}}',
                label: 'Size Needed',
                hint: 'e.g. Small, Medium, Large, One-Size.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--8276',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--13': {
            id: 'input--13',
            widget: 'input',
            parent: {
                id: 'container--9582',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{uop}}',
                label: 'Unit of Purchase',
                hint: 'e.g. BOX, CASE, CONTAINER, DOZEN.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--13',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3682': {
            id: 'input--3682',
            widget: 'input',
            parent: {
                id: 'container--5601',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{pallet_size}}',
                label: 'Approximate Pallet Size',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--3682',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5364': {
            id: 'container--5364',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--5364',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--9582', 'container--5601'],
                },
            },
        },
        'container--9582': {
            id: 'container--9582',
            widget: 'container',
            parent: {
                id: 'container--5364',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--9582',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--13'],
                },
            },
        },
        'container--5601': {
            id: 'container--5601',
            widget: 'container',
            parent: {
                id: 'container--5364',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--5601',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--3682'],
                },
            },
        },
        'input--163': {
            id: 'input--163',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{count_uop}}',
                label: 'Packaging Multiple',
                hint: 'This is the number of eaches within one unit of purchase. This field has a minimum value of 0.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--163',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--9695': {
            id: 'container--9695',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--9695',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--163'],
                },
            },
        },
        'input--2266': {
            id: 'input--2266',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{total_eaches_needed}}',
                label: 'Total Eaches Needed',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{cal_sheet.isLoading}}',
                route: 'input--2266',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5555': {
            id: 'container--5555',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--5555',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--2266'],
                },
            },
        },
        'container--9899': {
            id: 'container--9899',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--9899',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--9695', 'container--5555'],
                },
            },
        },
        'input--7831': {
            id: 'input--7831',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{cost}}',
                label: 'Price',
                hint: 'Please enter a price for the item.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{get_item_dets_sheet.isLoading}}',
                route: 'input--7831',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--6306': {
            id: 'container--6306',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--6306',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--7831'],
                },
            },
        },
        'input--6164': {
            id: 'input--6164',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{price}}',
                label: 'Item Cost',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: '{{cal_sheet.isLoading}}',
                route: 'input--6164',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--2614': {
            id: 'container--2614',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--2614',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--6164'],
                },
            },
        },
        'container--6606': {
            id: 'container--6606',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                },
                route: 'container--6606',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--6306', 'container--2614'],
                },
            },
        },
        'input--4199': {
            id: 'input--4199',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '1',
                label: 'Quantity of UOP Needed',
                hint: "This is the quantity of 'Unit of Purchase' needed. Quantity must be greater than 0.",
                type: 'number',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--4199',
            },
            listeners: {
                onChange: [
                    {
                        message: ActionMessages.RUN_QUERY,
                        payload: {
                            queryId: 'calculate_item_values',
                        },
                    },
                ],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--3792': {
            id: 'input--3792',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '{{critical_level}}',
                label: 'Critical Item Level',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--3792',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--8693': {
            id: 'input--8693',
            widget: 'input',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '2025-02-08',
                label: 'Date Needed',
                hint: 'Please select a date that is in the future.',
                type: 'date',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--8693',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--5656': {
            id: 'container--5656',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'row',
                    padding: '4px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                },
                route: 'container--5656',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['checkbox--9484', 'text--7412'],
                },
            },
        },
        'checkbox--9484': {
            id: 'checkbox--9484',
            widget: 'checkbox',
            parent: {
                id: 'container--5656',
                slot: 'children',
            },
            data: {
                style: {
                    padding: 'none',
                },
                label: 'Example Checkbox',
                required: false,
                disabled: false,
                value: false,
                route: 'checkbox--9484',
            },
            listeners: {
                onChange: [],
            },
            slots: {},
        },
        'text--7412': {
            id: 'text--7412',
            widget: 'text',
            parent: {
                id: 'container--5656',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{isSurgery}}',
                variant: 'p',
                route: 'text--7412',
            },
            listeners: {},
            slots: {},
        },
        'text--4053': {
            id: 'text--4053',
            widget: 'text',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Will this be used for surgery?',
                variant: 'p',
                route: 'text--4053',
            },
            listeners: {},
            slots: {},
        },
        'container--6796': {
            id: 'container--6796',
            widget: 'container',
            parent: {
                id: 'container--4086',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '16px',
                    flexWrap: 'wrap',
                    backgroundColor: '#fef9f4',
                },
                route: 'container--6796',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--1825'],
                },
            },
        },
        'text--3101': {
            id: 'text--3101',
            widget: 'text',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date:',
                variant: 'p',
                route: 'text--3101',
            },
            listeners: {},
            slots: {},
        },
        'text--727': {
            id: 'text--727',
            widget: 'text',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date:',
                variant: 'p',
                route: 'text--727',
            },
            listeners: {},
            slots: {},
        },
        'container--4028': {
            id: 'container--4028',
            widget: 'container',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--4028',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--5853'],
                },
            },
        },
        'container--4447': {
            id: 'container--4447',
            widget: 'container',
            parent: {
                id: 'page-1',
                slot: 'content',
            },
            data: {
                style: {
                    padding: '8px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                    backgroundColor: '#082753',
                    alignItems: 'center',
                    margin: '0px',
                },
                route: 'container--4447',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['image--6595', 'text--7053'],
                },
            },
        },
        'image--6595': {
            id: 'image--6595',
            widget: 'image',
            parent: {
                id: 'container--4447',
                slot: 'children',
            },
            data: {
                src: 'https://gray-wistv-prod.gtv-cdn.com/resizer/v2/KBZNYHBVDJAIZIHUFQOI34EMIA.jpg?auth=6d517d1526e9d3994c769c901cbea38823b85cbdc31622ff7c5b4d9ce68c941d&width=1600&height=900&smart=true',
                style: {
                    alignItems: 'center',
                    display: 'flex',
                    width: '200px',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    justifyContent: 'center',
                    height: '90px',
                },
                title: '',
                route: 'image--6595',
            },
            listeners: {},
            slots: {},
        },
        'text--7053': {
            id: 'text--7053',
            widget: 'text',
            parent: {
                id: 'container--4447',
                slot: 'children',
            },
            data: {
                variant: 'h1',
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ffffff',
                },
                text: 'National Contingency Response Tool',
                route: 'text--7053',
            },
            listeners: {},
            slots: {},
        },
        'text--774': {
            id: 'text--774',
            widget: 'text',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: '{{inv_date}}',
                variant: 'p',
                route: 'text--774',
            },
            listeners: {},
            slots: {},
        },
        'text--8665': {
            id: 'text--8665',
            widget: 'text',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: '{{inv_date}}',
                variant: 'p',
                route: 'text--8665',
            },
            listeners: {},
            slots: {},
        },
        'container--6731': {
            id: 'container--6731',
            widget: 'container',
            parent: {
                id: 'container--1786',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    width: '48%',
                    border: '0px  ',
                },
                route: 'container--6731',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--5431', 'text--3101', 'text--8665'],
                },
            },
        },
        'container--6144': {
            id: 'container--6144',
            widget: 'container',
            parent: {
                id: 'container--1786',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                    width: '48%',
                    border: '0px  ',
                },
                route: 'container--6144',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--2038', 'text--727', 'text--774'],
                },
            },
        },
        'input--5431': {
            id: 'input--5431',
            widget: 'input',
            parent: {
                id: 'container--6731',
                slot: 'children',
            },
            data: {
                hint: "Warehouse's requestable quantity of 'Eaches' for the product requested.",
                multiline: false,
                style: {
                    padding: '4px',
                    width: '100%',
                },
                disabled: false,
                label: 'Requestable Quantity',
                type: 'text',
                rows: 1,
                loading: '{{get_item_dets_sheet.isLoading}}',
                value: '{{REQ_QUANT_UOP}}',
                required: false,
                route: 'input--5431',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'input--2038': {
            id: 'input--2038',
            widget: 'input',
            parent: {
                id: 'container--6144',
                slot: 'children',
            },
            data: {
                hint: "Warehouse's quantity on hand of 'Eaches' for the product requested.",
                multiline: false,
                style: {
                    padding: '4px',
                    width: '100%',
                },
                disabled: false,
                label: 'Quantity on Hand (Eaches)',
                type: 'text',
                rows: 1,
                loading: '{{get_item_dets_sheet.isLoading}}',
                value: '{{req_quant_ea}}',
                required: false,
                route: 'input--2038',
            },
            listeners: {
                onChange: [],
            },
            slots: {
                content: {
                    name: 'content',
                    children: [],
                },
            },
        },
        'container--1786': {
            id: 'container--1786',
            widget: 'container',
            parent: {
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--1786',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--6731', 'container--6144'],
                },
            },
        },
        'container--1804': {
            id: 'container--1804',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--1804',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--8522', 'text--7629'],
                },
            },
        },
        'text--7629': {
            id: 'text--7629',
            widget: 'text',
            parent: {
                id: 'container--1804',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{date_needed}}',
                variant: 'p',
                route: 'text--7629',
            },
            listeners: {},
            slots: {},
        },
        'text--4742': {
            id: 'text--4742',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Quantity of UOP:',
                variant: 'p',
                route: 'text--4742',
            },
            listeners: {},
            slots: {},
        },
        'text--2808': {
            id: 'text--2808',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: '{{quant_uop_needed}}',
                variant: 'p',
                route: 'text--2808',
            },
            listeners: {},
            slots: {},
        },
        'container--7610': {
            id: 'container--7610',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--7610',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--4742', 'text--2808'],
                },
            },
        },
        'text--9340': {
            id: 'text--9340',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Size Needed:',
                variant: 'p',
                route: 'text--9340',
            },
            listeners: {},
            slots: {},
        },
        'text--9865': {
            id: 'text--9865',
            widget: 'text',
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: ' {{size}} ',
                variant: 'p',
                route: 'text--9865',
            },
            listeners: {},
            slots: {},
        },
        'container--6430': {
            id: 'container--6430',
            widget: 'container',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    display: 'flex',
                    gap: '8px',
                },
                route: 'container--6430',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--9340', 'text--9865'],
                },
            },
        },
        'text--6404': {
            id: 'text--6404',
            widget: 'text',
            parent: {
                id: 'container--5853',
                slot: 'children',
            },
            data: {
                variant: 'h6',
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    textAlign: 'center',
                },
                text: '{{submit_message}}',
                route: 'text--6404',
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {
        selected_visn: {
            type: 'block',
            to: 'select--4306',
        },
        selected_station: {
            type: 'block',
            to: 'select--6283',
        },
        ncrt_db_id: {
            type: 'string',
            value: 'fe5e2c23-59e6-42ae-939d-b2ca9699f38c',
        },
        selected_group: {
            type: 'block',
            to: 'select--4654',
        },
        selected_category: {
            type: 'block',
            to: 'select--9999',
        },
        selected_item: {
            type: 'block',
            to: 'select--2432',
        },
        get_request_options: {
            type: 'query',
            to: 'get_request_options',
        },
        visns: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '30014',
        },
        stations: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '67063',
        },
        facilities: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '28365',
        },
        groups: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '77120',
        },
        categories: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '49665',
        },
        items: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '9881',
        },
        pixel_call: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '96686',
        },
        unformatted_item_dets: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '51981',
        },
        manu_name: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '41113',
        },
        manu_duns: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '76103',
        },
        oem_part_num: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '29237',
        },
        size: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '23418',
        },
        uop: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '28529',
        },
        pallet_size: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '87532',
        },
        cost: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '14083',
        },
        REQ_QUANT_UOP: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '89358',
        },
        req_quant_ea: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '16171',
        },
        inv_date: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '6290',
        },
        count_uop: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '31712',
        },
        quant_uop_needed: {
            type: 'block',
            to: 'input--4199',
        },
        price: {
            type: 'cell',
            to: 'calculate_item_values',
            cellId: '72814',
        },
        total_eaches_needed: {
            type: 'cell',
            to: 'calculate_item_values',
            cellId: '88277',
        },
        critical_level: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '86478',
        },
        isSurgery: {
            type: 'block',
            to: 'checkbox--9484',
        },
        allowSub: {
            type: 'block',
            to: 'checkbox--4625',
        },
        date_needed: {
            type: 'block',
            to: 'input--8693',
        },
        name: {
            type: 'block',
            to: 'input--7344',
        },
        phone_num: {
            type: 'block',
            to: 'input--9160',
        },
        phone_ext: {
            type: 'block',
            to: 'input--5159',
        },
        email: {
            type: 'block',
            to: 'input--413',
        },
        item_type: {
            type: 'block',
            to: 'radio--5298',
        },
        add_info: {
            type: 'block',
            to: 'input--3977',
        },
        vha_mission: {
            type: 'block',
            to: 'checkbox--1671',
        },
        selected_facility: {
            type: 'block',
            to: 'select--1578',
        },
        java_submit_obj: {
            type: 'cell',
            to: 'submit_request',
            cellId: '53064',
        },
        fac_info: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '67337',
        },
        ncrtShipId: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '45406',
        },
        addy: {
            type: 'cell',
            to: 'get_request_options',
            cellId: '85694',
        },
        item_desc: {
            type: 'cell',
            to: 'get_item_details',
            cellId: '3521',
        },
        is_cat_item: {
            type: 'block',
            to: 'checkbox--3303',
        },
        'sub_req-sheet': {
            type: 'query',
            to: 'submit_request',
        },
        submit_message: {
            type: 'cell',
            to: 'submit_request',
            cellId: '20430',
        },
        get_item_dets_sheet: {
            type: 'query',
            to: 'get_item_details',
        },
        cal_sheet: {
            type: 'query',
            to: 'calculate_item_values',
        },
    },
    executionOrder: [
        'submit_request',
        'get_request_options',
        'get_item_details',
        'calculate_item_values',
    ],
    version: '1.0.0-alpha.4',
};

export const Ncrt = () => {
    Env.update({
        MODULE: 'vha-supply',
    });

    return (
        <div style={{ height: '100vh', width: '100vw' }}>
            <InsightProvider>
                <Renderer state={state} />
            </InsightProvider>
        </div>
    );
};
