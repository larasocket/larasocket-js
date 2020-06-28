import { Message } from './message';
import { OutgoingNetworkInterface } from './outgoing-network-interface';

/**
 * LinkMessage
 */
export class LinkMessage extends Message implements OutgoingNetworkInterface {
    /**
     * Laravel Websocket API key.
     */
    token: string;

    /**
     * Laravel Websocket API key.
     */
    uuid: string;

    /**
     * Create a new class instance.
     */
    constructor(token: string, uuid: string) {
        super();
        this.token = token;
        this.uuid = uuid;
    }

    /**
     *
     */
    toNetworkJson(): object {
        return {
            action: 'link',
            token: this.token,
            uuid: this.uuid,
        };
    }
}
