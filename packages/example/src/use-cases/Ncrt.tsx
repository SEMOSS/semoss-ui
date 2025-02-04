import React from 'react';

import { Env, InsightProvider } from '@semoss/sdk';
import { Renderer, SerializedState } from '@semoss/renderer';

const state: SerializedState = {
    queries: {},
    blocks: {
        'page-1': {
            slots: {
                content: {
                    children: [
                        'text--5866',
                        'container--5853',
                        'markdown--3077',
                        'text--7706',
                        'container--718',
                        'text--5695',
                        'container--5946',
                        'text--3947',
                        'container--4934',
                        'container--5755',
                    ],
                    name: 'content',
                },
            },
            parent: null,
            widget: 'page',
            data: {
                style: {
                    padding: '24px',
                    fontFamily: 'roboto',
                    flexDirection: 'column',
                    display: 'flex',
                    gap: '8px',
                },
                route: '',
            },
            listeners: {
                onPageLoad: [],
            },
            id: 'page-1',
        },
        'container--5853': {
            id: 'container--5853',
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
                },
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--2934', 'text--4172'],
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
                id: 'page-1',
                slot: 'content',
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
                id: 'page-1',
                slot: 'content',
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
                id: 'page-1',
                slot: 'content',
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
                value: '',
                label: 'VISN',
                hint: '',
                options: [],
                required: false,
                disabled: false,
                loading: false,
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
                value: '',
                label: 'STATION',
                hint: '',
                options: [],
                required: false,
                disabled: false,
                loading: false,
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
                value: '',
                label: 'FACILITY',
                hint: '',
                options: [],
                required: false,
                disabled: false,
                loading: false,
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
                value: 'commodities',
                label: "Please select an option for the request's type *",
                isGroup: false,
                options: [
                    {
                        label: 'Commodities',
                        value: 'commodities',
                    },
                    {
                        label: 'Equipment',
                        value: 'equipment',
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
                id: 'page-1',
                slot: 'content',
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
                value: '',
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
                value: '',
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
                value: '',
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
                value: '',
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
                value: '',
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
                value: '',
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
                        'container--6796',
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
                loading: false,
                disabled: false,
                variant: 'contained',
                color: 'primary',
                route: 'button--4571',
            },
            listeners: {
                onClick: [],
            },
            slots: {},
        },
        'container--5755': {
            id: 'container--5755',
            widget: 'container',
            parent: {
                id: 'page-1',
                slot: 'content',
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
                id: 'page-1',
                slot: 'content',
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
                value: false,
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
                        'container--8681',
                        'text--3101',
                        'text--727',
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
                },
                route: 'container--4086',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['text--2207', 'container--1154'],
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
                text: '{{item-type}}',
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
                id: 'container--1154',
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
                    children: ['text--8522', 'text--6704', 'text--5119'],
                },
            },
        },
        'text--6704': {
            id: 'text--6704',
            widget: 'text',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Quantity of UOP:',
                variant: 'p',
                route: 'text--6704',
            },
            listeners: {},
            slots: {},
        },
        'text--5119': {
            id: 'text--5119',
            widget: 'text',
            parent: {
                id: 'container--1154',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                },
                text: 'Size Needed:',
                variant: 'p',
                route: 'text--5119',
            },
            listeners: {},
            slots: {},
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
                value: false,
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
                text: '{{checbox-status}}',
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
                value: '',
                label: 'Group',
                hint: 'eg. DIALYSIS, PPE. This is a required field',
                options: [],
                required: false,
                disabled: false,
                loading: false,
                route: 'select--4654',
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
                value: '',
                label: 'Category',
                hint: 'e.g. BACTERIAL SPRAY, GLOVE. This is a required field.',
                options: [],
                required: false,
                disabled: false,
                loading: false,
                route: 'select--9999',
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
                value: '',
                label: 'Item',
                hint: 'e.g. N95 MASK, SURGICAL GOWN. This is a required field.',
                options: [],
                required: false,
                disabled: false,
                loading: false,
                route: 'select--2432',
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
                value: '',
                label: 'Manufacturer Name',
                hint: 'This is a required field and has a maximum character limit of 50 characters.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                loading: false,
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
                value: '',
                label: 'Manufacturer DUNS',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'OEM Part Number',
                hint: 'Please enter OEM Part Number.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Size Needed',
                hint: 'e.g. Small, Medium, Large, One-Size.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Unit of Purchase',
                hint: 'e.g. BOX, CASE, CONTAINER, DOZEN.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Approximate Pallet Size',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Packaging Multiple',
                hint: 'This is the number of eaches within one unit of purchase. This field has a minimum value of 0.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Total Eaches Needed',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
        'input--971': {
            id: 'input--971',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Requestable Quantity',
                hint: "Warehouse's requestable quantity of 'Eaches' for the product requested.",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--971',
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
        'container--458': {
            id: 'container--458',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '48%',
                },
                route: 'container--458',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--971'],
                },
            },
        },
        'input--6177': {
            id: 'input--6177',
            widget: 'input',
            data: {
                style: {
                    width: '100%',
                    padding: '4px',
                },
                value: '',
                label: 'Quantity on Hand (Eaches)',
                hint: "Warehouse's quantity on hand of 'Eaches' for the product requested.",
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
                route: 'input--6177',
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
        'container--6880': {
            id: 'container--6880',
            widget: 'container',
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '0px',
                    gap: '8px',
                    flexWrap: 'wrap',
                    width: '50%',
                },
                route: 'container--6880',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['input--6177'],
                },
            },
        },
        'container--8681': {
            id: 'container--8681',
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
                route: 'container--8681',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--458', 'container--6880'],
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
                value: '',
                label: 'Price',
                hint: 'Please enter a price for the item.',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
                label: 'Item Cost',
                hint: '',
                type: 'text',
                rows: 1,
                multiline: false,
                disabled: false,
                required: false,
                loading: false,
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
                value: '',
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
                onChange: [],
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
                value: '',
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
                value: '2025-01-30',
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
                text: '{{yes-no}}',
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
                id: 'container--4934',
                slot: 'children',
            },
            data: {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    padding: '4px',
                    gap: '16px',
                    flexWrap: 'wrap',
                    backgroundColor: '#fffeba',
                },
                route: 'container--6796',
            },
            listeners: {},
            slots: {
                children: {
                    name: 'children',
                    children: ['container--4086', 'container--1825'],
                },
            },
        },
        'text--3101': {
            id: 'text--3101',
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
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date: October 01, 2024',
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
                id: 'container--1825',
                slot: 'children',
            },
            data: {
                style: {
                    padding: '4px',
                    whiteSpace: 'pre-line',
                    textOverflow: 'ellipsis',
                    color: '#ff0505',
                },
                text: 'Last Updated Inventory Date: October 01, 2024',
                variant: 'p',
                route: 'text--727',
            },
            listeners: {},
            slots: {},
        },
    },
    variables: {},
    executionOrder: [],
    version: '1.0.0-alpha.4',
};

export const Ncrt = () => {
    Env.update({
        MODULE: 'vha-supply',
    });

    return (
        <div>
            <InsightProvider>
                <Renderer state={state} />
            </InsightProvider>
        </div>
    );
};
