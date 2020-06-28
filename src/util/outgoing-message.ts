import { Message } from './message';
import { OutgoingNetworkInterface } from './outgoing-network-interface';

export enum OutgoingMessageType {
    LINK_CONNECTION = 'link',
    SUBSCRIBE = 'subscribe',
    UNSUBSCRIBE = 'unsubscribe',
    WHISPER = 'whisper',
    BROADCAST = 'broadcast',
}

/**
 * OutgoingMessage
 */
export class OutgoingMessage extends Message implements OutgoingNetworkInterface {
    /**
     * Laravel Websocket API key.
     */
    token: string;

    /**
     * Laravel Websocket API key.
     */
    connectionId!: string;

    /**
     * Event namespace.
     */
    action: OutgoingMessageType;

    /**
     * Event namespace.
     */
    event?: string;

    /**
     * Event namespace.
     */
    payload?: any;

    /**
     * Create a new class instance.
     */
    constructor(token: string, action: OutgoingMessageType) {
        super();
        this.token = token;
        this.action = action;
        // this.connectionId = connectionId;
    }

    /**
     *
     */
    toNetworkJson(): object {
        return {
            event: this.event,
            token: this.token,
            connection_id: this.connectionId,
            action: this.action,
            payload: this.payload,
            channel: this.channel?.name,
        };
    }
}
