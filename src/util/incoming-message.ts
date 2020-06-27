import { LarasocketChannel } from '../channel';
import {Message} from "./message";

export enum IncomingMessageType {
    LINKED = 'linked',
}

/**
 * SocketMessage
 */
export class IncomingMessage extends Message {
    /**
     * Event namespace.
     */
    action?: IncomingMessageType;

    /**
     * Event namespace.
     */
    event?: string;

    /**
     * Event namespace.
     */
    connection_id?: string;

    /**
     * Event namespace.
     */
    payload?: any;

    /**
     * Create a new class instance.
     */
    constructor(rawJson: any) {
        super();
        this.action = rawJson.action;
        this.event = rawJson.event;
        this.payload = rawJson.payload;
        this.connection_id = rawJson.connection_id;
    }
}
