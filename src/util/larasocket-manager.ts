import { LarasocketChannel, LarasocketPresenceChannel, LarasocketPrivateChannel } from '../channel';
import { EventFormatter } from './event-formatter';
import { IncomingMessage, IncomingMessageType } from './incoming-message';
import { OutgoingMessage, OutgoingMessageType } from './outgoing-message';
import { OutgoingNetworkInterface } from './outgoing-network-interface';
import { LinkMessage } from './link-message';

/**
 * Event name formatter
 */
export class LarasocketManager {
    /**
     *
     */
    public uuid: string;

    /**
     *
     */
    protected csrf?: string;

    /**
     *
     */
    protected options: any;

    /**
     *
     */
    protected websocketInstance?: WebSocket;

    /**
     *
     */
    protected websocketInitializationPromise?: Promise<WebSocket>;

    /**
     *
     */
    public connectionId!: string;

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
        this.csrf = options.auth.headers['X-CSRF-TOKEN'];
        this.uuid = this.uuidv4();
    }

    /**
     *
     */
    disconnect() {
        this.websocketInstance?.close();
    }

    /**
     * Subscribe to a given channel.
     *
     * @param channel
     */
    subscribe(channel: LarasocketChannel) {
        this.authenticate(channel).then((response) => {
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
    public getSocketMessage(type: OutgoingMessageType): OutgoingMessage {
        return new OutgoingMessage(this.options.token, type);
    }

    /**
     *
     * @param message
     */
    public send(message: OutgoingMessage) {
        this.getWebsocketInstance().then((socket) => {
            message.connectionId = this.connectionId; // sometimes, we dont have connectionId information until this callback.
            socket.send(JSON.stringify(message.toNetworkJson()));
        });
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
                const payloadForListeners = message.payload;
                this.listeners[formattedEventName](payloadForListeners);
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
            return this.getAuthNetworkPromise(channel.name).then((response: any) => {
                return response.data;
            });
        }

        return Promise.resolve(); // dummy Promise. No auth for public channels.
    }

    /**
     *
     * @param channelName
     */
    protected getAuthNetworkPromise(channelName: string): Promise<any> {
        return this.getWebsocketInstance().then((socket) => {
            const endpoint = this.options.authEndpoint;

            if (typeof Vue === 'function' && Vue.http) {
                return Vue.http.post(endpoint, {
                    socket_id: this.connectionId!,
                    channel_name: channelName,
                    _token: this.csrf,
                });
            }

            if (typeof axios === 'function') {
                return axios.post(endpoint, {
                    socket_id: this.connectionId!,
                    channel_name: channelName,
                    _token: this.csrf,
                });
            }

            if (typeof jQuery === 'function') {
                return jQuery.post(endpoint, {
                    socket_id: this.connectionId!,
                    channel_name: channelName,
                    _token: this.csrf,
                });
            }

            throw new Error('Need either Vue.http, axios, or jQuery');
        });
    }

    /**
     * Used to link a socket connection to a db connection.
     */
    protected uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            // tslint:disable-next-line
            const r = (Math.random() * 16) | 0;
            // tslint:disable-next-line
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     *
     */
    protected getWebsocketInstance(): Promise<WebSocket> {
        if (this.websocketInstance) {
            return Promise.resolve(this.websocketInstance);
        }

        return this.initializeSocket();
    }

    /**
     *
     */
    protected websocketInstanceReady(socket: WebSocket) {
        this.websocketInstance = socket;
        this.websocketInitializationPromise = undefined;
    }

    /**
     * Initialize an websocket connection.
     */
    protected initializeSocket(): Promise<WebSocket> {
        if (this.websocketInitializationPromise) {
            return this.websocketInitializationPromise;
        }

        this.websocketInitializationPromise = new Promise((resolve, reject) => {
            const token = encodeURIComponent(this.options.token);
            const uuid = this.uuid;
            const socket = new WebSocket(`wss://avhbh1wztc.execute-api.us-east-1.amazonaws.com/local?token=${token}&uuid=${uuid}`);

            // Connection opened
            socket.addEventListener('open', (event) => {
                socket.send(JSON.stringify(new LinkMessage(token, uuid).toNetworkJson()));
            });

            // Listen for messages
            socket.addEventListener('message', (event) => {
                const rawMessage = event.data;

                try {
                    const rawJson = JSON.parse(rawMessage);

                    const message = new IncomingMessage(rawJson);

                    if (message.action === IncomingMessageType.LINKED) {
                        this.connectionId = message.connectionId!;
                        this.websocketInstanceReady(socket);
                        resolve(socket);
                    } else {
                        this.route(message);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        return this.websocketInitializationPromise;
    }
}
