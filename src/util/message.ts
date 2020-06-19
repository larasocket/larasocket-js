import {LaravelWebsocketsChannel} from "../channel";

export enum MessageType {
    LINK_CONNECTION = 'LINK_CONNECTION',
    SUBSCRIBE = 'SUBSCRIBE',
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    COMMUNICATION = 'COMMUNICATION',
}

/**
 * SocketMessage
 */
export class Message {
    /**
     * Laravel Websocket API key.
     */
    token: string;

    /**
     * Event namespace.
     */
    action: MessageType;

    /**
     * Laravel Websocket API key.
     */
    channel: LaravelWebsocketsChannel | null = null;

    /**
     * Event namespace.
     */
    event: string | null = null;

    /**
     * Event namespace.
     */
    payload: object | null = null;

    /**
     * Create a new class instance.
     */
    constructor(token: string, action: MessageType) {
        this.token = token;
        this.action = action;
    }

    /**
     *
     */
    toNetworkJson(): object {
        return {
            'event': this.event,
            'token': this.token,
            'action': this.action,
            'channel': this.channel?.name,
        };
    }
}
