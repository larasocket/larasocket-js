import { LarasocketChannel } from '../channel';

/**
 * SocketMessage
 */
export class Message {
    /**
     * Laravel Websocket API key.
     */
    channel?: LarasocketChannel;

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
    constructor() {
        // this.token = token;
        // this.action = action;
        // this.connectionId = connectionId;
    }

    // static make(token: string, json: any): Message {
    //     let message = new Message(token, json.action);
    //
    //     message = Object.assign(message, json);
    //
    //     if (typeof message.payload === 'string') {
    //         try {
    //             message.payload = JSON.parse(message.payload);
    //         } catch (e) {
    //             // tslint:disable-next-line
    //             console.log('Failed to parse payload from the message', e);
    //         }
    //     }
    //
    //     return message;
    // }
}
