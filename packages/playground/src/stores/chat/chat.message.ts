import { MessageResponse } from '@/types';
import { makeAutoObservable } from 'mobx';

export interface ChatMessageInterface {
    /**
     * Id of the message
     */
    messageId: string;

    /**
     * Question that was asked to the agent
     */
    question: string;

    /**
     * Response by the agent. Can be a string, artifact, or tool response
     */
    response: MessageResponse[];

    /**
     * Sources used in the response
     */
    sources: string[];

    /**
     * Feedback provided by the user; only applicable to messages provided via the LLM
     */
    rating: {
        /** Sentiment */
        positive: boolean;

        /** Associated comment */
        comment: string;
    } | null;
}

/**
 * Internal state management of the builder object
 */
export class ChatMessage {
    private _store: ChatMessageInterface = {
        messageId: '',
        question: '',
        response: [],
        sources: [],
        rating: null,
    };

    constructor(question: ChatMessageInterface['question']) {
        // set the initial question
        this._store.question = question;

        // make it observable
        makeAutoObservable(this);
    }

    /**
     * Getters
     */
    /**
     * Get the id of the message
     */
    get messageId() {
        return this._store.messageId;
    }

    /**
     * Get the question
     */
    get question() {
        return this._store.question;
    }

    /**
     * Get the response of the message
     */
    get response() {
        return this._store.response;
    }

    /**
     * Get as text
     */
    get responseText(): string {
        return this._store.response
            .map((r) => {
                if (r.type === 'CONTENT') {
                    return r.content;
                } else if (r.type === 'CODE') {
                    return r.content;
                } else if (r.type === 'FUNCTION') {
                    return r.content || '';
                } else if (r.type === 'APP' || r.type === 'PROJECT') {
                    return r.content || '';
                } else if (r.type === 'CONCLUSION') {
                    return '';
                }

                return '';
            })
            .join('\n');
    }

    /**
     * Get the rating/user feedback of the message
     */
    get rating() {
        return this._store.rating;
    }

    /**
     * Get the sources for the message
     */
    get sources() {
        return this._store.sources;
    }

    /** Actions */
    /**
     * Save the id of the message
     *
     * @param id - id to update
     */
    saveId(id: string) {
        this._store.messageId = id;
    }

    /**
     * Save the associated rating
     */
    saveRating(rating: ChatMessageInterface['rating']) {
        this._store.rating = rating;
    }

    /**
     * Save the associated rating
     */
    saveResponse(response: ChatMessageInterface['response']) {
        this._store.response = response;
    }

    /**
     * Save the associated rating
     */
    updateSources(sources: ChatMessageInterface['sources']) {
        this._store.sources = sources;
    }
}
