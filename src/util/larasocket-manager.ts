import {Message, MessageType} from "./message";
import {LarasocketChannel, LarasocketPresenceChannel, LarasocketPrivateChannel} from "../channel";
import {EventFormatter} from "./event-formatter";

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
    protected websocketInstance: WebSocket;

    /**
     *
     */
    protected listeners: { [key:string]: (message: Message) => void };

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
        this.websocketInstance = this.initializeSocket();
    }

    /**
     *
     */
    disconnect() {
        this.websocketInstance.close();
    }

    /**
     * Subscribe to a given channel.
     *
     * @param channel
     */
    subscribe(channel: LarasocketChannel) {
        this.authenticate(channel).then((response) => {
            const subscribeMessage = this.getSocketMessage(MessageType.SUBSCRIBE);

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
        const unsubscribeMessage = this.getSocketMessage(MessageType.UNSUBSCRIBE);

        unsubscribeMessage.channel = channel;

        this.send(unsubscribeMessage);
    }

    /**
     * Tie an event listener to an action.
     *
     * @param name
     * @param listener
     */
    on(name: string, listener: (message: Message) => void) {
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
    public getSocketMessage(type: MessageType): Message {
        return new Message(this.options.token, type);
    }

    /**
     *
     * @param message
     */
    public send(message: Message) {
        this.websocketInstance.send(JSON.stringify(message.toNetworkJson()));
    }

    /**
     * Routes an incoming massage for processing.
     *
     * @param message
     */
    protected route(message: Message) {
        if (! message.action) {
            return;
        }

        if (message.action === MessageType.RESPONSE) {
            // tslint:disable-next-line
            console.log("got socket response:", message.payload);
            return;
        }

        if (message.event) {
            const formattedEventName = this.eventFormatter.format(message.event);

            if (this.listeners[formattedEventName]) {
                const payloadForListeners = message.payload;
                this.listeners[formattedEventName](payloadForListeners);
            }
        }
    }

    /**
     * Initialize an websocket connection.
     */
    protected initializeSocket(): WebSocket {
        const socket = new WebSocket('wss://ws.larasocket.com');

        // Connection opened
        socket.addEventListener('open', (event) => {
            // tslint:disable-next-line
            console.log("Connection openned", event);

            const message = this.getSocketMessage(MessageType.LINK_CONNECTION);

            this.send(message);
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
            // tslint:disable-next-line
            console.log("Incoming message", event);

            const rawMessage = event.data;

            try {
                const rawJson = JSON.parse(rawMessage);

                const message = Message.make(this.options.token, rawJson);

                this.route(message);
            } catch (e) {
                // tslint:disable-next-line
                console.log("Failed parsing incoming message: ", e);
            }
        });

        return socket;
    }

    protected authenticate(channel: LarasocketChannel): Promise<any> {
        if (channel instanceof LarasocketPresenceChannel || channel instanceof LarasocketPrivateChannel) {
            return this.getAuthNetworkPromise(channel.name)
                .then((response: any) => {
                    return response.data;
                });
        }

        return Promise.resolve() // dummy Promise. No auth for public channels.
    }

    protected getAuthNetworkPromise(channelName: string): Promise<any> {
        const endpoint = this.options.authEndpoint;

        if (typeof Vue === 'function' && Vue.http) {
            return axios.post(endpoint);
        }

        if (typeof axios === 'function') {
            return axios.post(endpoint, {
                channel_name: channelName,
            });
        }

        if (typeof jQuery === 'function') {
            return axios.post(endpoint);
        }

        throw new Error('Need either Vue.http, axios, or jQuery');
    }
}
