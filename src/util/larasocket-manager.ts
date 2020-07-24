import { LarasocketChannel, LarasocketPresenceChannel, LarasocketPrivateChannel } from '../channel';
import { EventFormatter } from './event-formatter';
import { IncomingMessage, IncomingMessageType } from './incoming-message';
import { OutgoingMessage, OutgoingMessageType } from './outgoing-message';
import { LarasocketWebsocket } from './larasocket-websocket';

/**
 * Event name formatter
 */
export class LarasocketManager {
    /**
     *
     */
    protected options: any;

    /**
     *
     */
    protected websocketInstance: LarasocketWebsocket;

    /**
     *
     */
    protected subscribedChannels: { [key: string]: LarasocketChannel } = {};

    /**
     *
     */
    protected listeners: { [key: string]: (message: IncomingMessage) => void };

    /**
     * The event formatter.
     */
    protected eventFormatter: EventFormatter;

    /**
     * Create a new class instance.
     */
    constructor(options: any) {
        this.options = options;
        this.listeners = {};
        this.eventFormatter = new EventFormatter(options.namespace);
        this.websocketInstance = new LarasocketWebsocket(
            options,
            (d) => this.route(d),
            () => this.reconnect(),
        );
    }

    /**
     *
     */
    disconnect() {
        this.websocketInstance.close();
    }

    /**
     * Triggers subscription to each previously subscribed channel.
     */
    reconnect() {
        for (const channel of Object.values(this.subscribedChannels)) {
            this.subscribe(channel);
        }
    }

    /**
     * Subscribe to a given channel.
     *
     * @param channel
     */
    subscribe(channel: LarasocketChannel) {
        this.authenticate(channel).then((response) => {
            this.subscribedChannels[channel.name] = channel; // track so we can reconnect if needed.

            const subscribeMessage = this.getSocketMessage(OutgoingMessageType.SUBSCRIBE);

            subscribeMessage.payload = response;
            subscribeMessage.channel = channel;

            this.send(subscribeMessage);
        });
    }

    /**
     * Unsubscribe to a given channel.
     *
     * @param channel
     */
    unsubscribe(channel: LarasocketChannel) {
        delete this.subscribedChannels[channel.name]; // track so we can reconnect if needed.

        const unsubscribeMessage = this.getSocketMessage(OutgoingMessageType.UNSUBSCRIBE);

        unsubscribeMessage.channel = channel;

        this.send(unsubscribeMessage);
    }

    /**
     * Tie an event listener to an action.
     *
     * @param name
     * @param listener
     */
    on(name: string, listener: (message: IncomingMessage) => void) {
        const formattedEventName = this.eventFormatter.format(name);

        this.listeners[formattedEventName] = listener;
    }

    /**
     * Tie an event listener to an action.
     *
     * @param name
     */
    removeListener(name: string) {
        const formattedEventName = this.eventFormatter.format(name);

        delete this.listeners[formattedEventName];
    }

    /**
     *
     * @param type
     */
    getSocketMessage(type: OutgoingMessageType): OutgoingMessage {
        return new OutgoingMessage(this.options.token, type);
    }

    /**
     *
     * @param message
     */
    send(message: OutgoingMessage) {
        this.websocketInstance.send(message);
    }

    /**
     *
     */
    socketId(): string {
        return this.websocketInstance.connectionId;
    }

    /**
     * Routes an incoming massage for processing.
     *
     * @param message
     */
    protected route(message: IncomingMessage) {
        if (message.event) {
            const formattedEventName = this.eventFormatter.format(message.event);

            if (this.listeners[formattedEventName]) {
                try {
                    let payloadForListeners = message.payload;

                    if (typeof payloadForListeners === 'string') {
                        payloadForListeners = JSON.parse(payloadForListeners);
                    }

                    // convert payload into an object
                    this.listeners[formattedEventName](payloadForListeners);
                } catch (e) {
                    throw new Error('Failed to parse incoming message');
                }
            }
        }
    }

    /**
     * Authenticate a channel subscription.
     *
     * @param channel
     */
    protected authenticate(channel: LarasocketChannel): Promise<any> {
        if (channel instanceof LarasocketPresenceChannel || channel instanceof LarasocketPrivateChannel) {
            return this.websocketInstance.getAuthNetworkPromise(channel);
        }

        return Promise.resolve(); // dummy Promise. No auth for public channels.
    }
}
