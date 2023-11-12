/**
 * These are just examples for demo. This file is not intended for long term use - should pull from BE.
 */
import {
    TOKEN_TYPE_TEXT,
    TOKEN_TYPE_INPUT,
    INPUT_TYPE_TEXT,
} from '../prompt.constants';
import { Token } from '../prompt.types';

export const PromptExamples: {
    title: string;
    context: string;
    inputs: Token[];
    inputTypes: object;
}[] = [
    {
        title: 'Travel Guide',
        context:
            "I'm traveling to {{location}}. I want to know about {{instructions}}. Give me an itinerary and suggest places to visit.",
        inputs: [
            {
                index: 0,
                key: "I'm",
                display: "I'm",
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 1,
                key: 'traveling',
                display: 'traveling',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 2,
                key: 'to',
                display: 'to',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 3,
                key: 'location',
                display: 'location.',
                type: TOKEN_TYPE_INPUT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 4,
                key: 'I',
                display: 'I',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 5,
                key: 'want',
                display: 'want',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 6,
                key: 'to',
                display: 'to',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 7,
                key: 'know',
                display: 'know',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 8,
                key: 'about',
                display: 'about',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 9,
                key: 'instructions',
                display: 'instructions.',
                type: TOKEN_TYPE_INPUT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 10,
                key: 'Give',
                display: 'Give',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 11,
                key: 'me',
                display: 'me',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 12,
                key: 'an',
                display: 'an',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 13,
                key: 'itinerary',
                display: 'itinerary',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 14,
                key: 'and',
                display: 'and',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 15,
                key: 'suggest',
                display: 'suggest',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 16,
                key: 'places',
                display: 'place',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 17,
                key: 'to',
                display: 'to',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 18,
                key: 'visit',
                display: 'visit.',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
        ],
        inputTypes: {
            3: INPUT_TYPE_TEXT,
            9: INPUT_TYPE_TEXT,
        },
    },
    {
        title: 'Translator',
        context:
            'I want you to act as a translator. Translate {{question}} from English to {{language}}.',
        inputs: [
            {
                index: 0,
                key: 'I',
                display: 'I',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 1,
                key: 'want',
                display: 'want',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 2,
                key: 'you',
                display: 'you',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 3,
                key: 'to',
                display: 'to',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 4,
                key: 'act',
                display: 'act',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 5,
                key: 'as',
                display: 'as',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 6,
                key: 'a',
                display: 'a',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 7,
                key: 'translator',
                display: 'translator.',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 8,
                key: 'Translate',
                display: 'Translate',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 9,
                key: 'question',
                display: 'question',
                type: TOKEN_TYPE_INPUT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 10,
                key: 'from',
                display: 'from',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 11,
                key: 'English',
                display: 'English',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 12,
                key: 'to',
                display: 'to',
                type: TOKEN_TYPE_TEXT,
                isHiddenPhraseInputToken: false,
            },
            {
                index: 13,
                key: 'language',
                display: 'language.',
                type: TOKEN_TYPE_INPUT,
                isHiddenPhraseInputToken: false,
            },
        ],
        inputTypes: {
            9: INPUT_TYPE_TEXT,
            13: INPUT_TYPE_TEXT,
        },
    },
];
