import {LarasocketChannel} from "../channel";

export enum MessageType {
    LINK_CONNECTION = 'LINK_CONNECTION',
    SUBSCRIBE = 'SUBSCRIBE',
    UNSUBSCRIBE = 'UNSUBSCRIBE',
    COMMUNICATION = 'COMMUNICATION',
    WHISPER = 'WHISPER',
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
    channel: LarasocketChannel | null = null;

    /**
     * Event namespace.
     */
    event: string | null = null;

    /**
     * Event namespace.
     */
    payload: any | null = null;

    /**
     * Create a new class instance.
     */
    constructor(token: string, action: MessageType) {
        this.token = token;
        this.action = action;
    }

    static make(token: string, json: any): Message {
        let message = new Message(token, json.action);

        message = Object.assign(message, json);

        if (typeof message.payload === 'string') {
            try {
                message.payload = JSON.parse(message.payload);
            } catch (e) {
                // tslint:disable-next-line
                console.log('Failed to parse payload from the message', e);
            }
        }

        return message;
    }

    /**
     *
     */
    toNetworkJson(): object {
        return {
            'event': this.event,
            'token': this.token,
            'action': this.action,
            'payload': this.payload,
            'channel': this.channel?.name,
        };
    }
}
