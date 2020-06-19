import {Message, MessageType} from "./message";
import {LaravelWebsocketsChannel, LaravelWebsocketsPresenceChannel, LaravelWebsocketsPrivateChannel} from "../channel";
import {EventFormatter} from "./event-formatter";

/**
 * Event name formatter
 */
export class LaravelWebsocketManager {

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
     * Subscribe to a given channel.
     *
     * @param channel
     */
    subscribe(channel: LaravelWebsocketsChannel) {
        this.authenticate(channel).then(() => {
            let subscribeMessage = this.getSocketMessage(MessageType.SUBSCRIBE);

            subscribeMessage.channel = channel;

            this.send(subscribeMessage);
        });
    }

    /**
     * Unsubscribe to a given channel.
     *
     * @param channel
     */
    unsubscribe(channel: LaravelWebsocketsChannel) {
        let unsubscribeMessage = this.getSocketMessage(MessageType.UNSUBSCRIBE);

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
     * Routes an incoming massage for processing.
     *
     * @param message
     */
    protected route(message: Message) {
        if (! message.action) {
            return;
        }

        if (message.event) {
            const formattedEventName = this.eventFormatter.format(message.event);

            if (this.listeners[formattedEventName]) {
                this.listeners[formattedEventName](message);
            }
        }
    }

    /**
     * Initialize an websocket connection.
     */
    protected initializeSocket(): WebSocket {
        const socket = new WebSocket('wss://wss.zachvv.me');

        // Connection opened
        socket.addEventListener('open', (event) => {
            // tslint:disable-next-line
            console.log("Connection openned", event);

            let message = this.getSocketMessage(MessageType.LINK_CONNECTION);

            this.send(message);
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
            // tslint:disable-next-line
            console.log("Incoming message", event);

            let { action } = event.data;

            let message = this.getSocketMessage(action);

            this.route(message);
        });

        return socket;
    }

    protected authenticate(channel: LaravelWebsocketsChannel): Promise<any> {
        if (channel instanceof LaravelWebsocketsPresenceChannel || channel instanceof LaravelWebsocketsPrivateChannel) {
            return this.getAuthNetworkPromise(channel.name)
                .then((response: any) => {
                    return 'success';
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

    protected getSocketMessage(type: MessageType): Message {
        const message = new Message(this.options.token, type);

        return message;
    }

    protected send(message: Message) {
        this.websocketInstance.send(JSON.stringify(message.toNetworkJson()));
    }
}
