import { LarasocketChannel, LarasocketPresenceChannel, LarasocketPrivateChannel } from '../channel';
import { IncomingMessage, IncomingMessageType } from './incoming-message';
import { LinkMessage } from './link-message';
import { OutgoingMessage } from './outgoing-message';

/**
 * Event name formatter
 */
export class LarasocketWebsocket {
    /**
     *
     */
    protected uuid: string;

    /**
     *
     */
    protected token: string;

    /**
     *
     */
    protected timeout: number = 500;

    /**
     *
     */
    protected currentTimeout?: NodeJS.Timeout;

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
    protected websocketUrl: string;

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
    protected onMessageListener: (data: IncomingMessage) => void;

    /**
     *
     */
    protected reconnectListener: (socket: LarasocketWebsocket) => void;

    /**
     *
     */
    public connectionId!: string;

    /**
     * Create a new class instance.
     */
    constructor(
        options: any,
        onMessageListener: (data: IncomingMessage) => void,
        onReconnectListener: (socket: LarasocketWebsocket) => void,
    ) {
        this.options = options;
        this.csrf = options.auth.headers['X-CSRF-TOKEN'];
        this.uuid = this.uuidv4();
        this.onMessageListener = onMessageListener;
        this.reconnectListener = onReconnectListener;
        this.websocketUrl = options.wsHost || 'ws.larasocket.com';
        this.token = encodeURIComponent(this.options.token);
    }

    /**
     *
     */
    close() {
        if (this.websocketInstance) {
            this.websocketInstance.close();
        }
    }

    /**
     * Send string data over the websocket connection.
     *
     * @param message
     */
    send(message: OutgoingMessage) {
        this.getWebsocketInstance().then((socket) => {
            message.connectionId = this.connectionId; // sometimes, we dont have connectionId information until this callback.
            socket.send(JSON.stringify(message.toNetworkJson()));
        });
    }

    /**
     *
     * @param channel
     */
    getAuthNetworkPromise(channel: LarasocketChannel): Promise<any> {
        return this.getWebsocketInstance().then((socket) => {
            if (this.options.authorizer) {
                const authorizer = this.options.authorizer(channel, this.options);

                return new Promise((resolve, reject) => {
                    authorizer.authorize(this.connectionId!, (error: boolean, data: any) => {
                        if (error) {
                            return reject(data);
                        }

                        return resolve(data);
                    });
                });
            }

            let networkAgent;

            if (typeof Vue === 'function' && Vue.http) {
                networkAgent = Vue.http;
            }

            if (typeof axios === 'function') {
                networkAgent = axios;
            }

            if (typeof jQuery === 'function') {
                networkAgent = jQuery;
            }

            if (networkAgent) {
                return networkAgent
                    .post(this.options.authEndpoint, {
                        socket_id: this.connectionId!,
                        channel_name: channel.name,
                        _token: this.csrf,
                    })
                    .then((response: any) => {
                        return response.data;
                    });
            } else {
                return fetch(this.options.authEndpoint, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        socket_id: this.connectionId!,
                        channel_name: channel.name,
                        _token: this.csrf,
                    }),
                }).then((response: any) => {
                    return response.json();
                });
            }

            throw new Error('Need either Vue.http, axios, jQuery, or fetch.');
        });
    }

    /**
     * Return a promise that will resolve the websocket instance.
     */
    protected getWebsocketInstance(): Promise<WebSocket> {
        if (this.websocketInstance) {
            return Promise.resolve(this.websocketInstance);
        }

        return this.connect();
    }

    /**
     * The connection is ready.
     */
    protected websocketInstanceReady(socket: WebSocket) {
        this.websocketInstance = socket;
        this.websocketInitializationPromise = undefined;
    }

    /**
     * Reset and connect to the websocket.
     */
    protected reconnect(): Promise<WebSocket> {
        this.websocketInitializationPromise = undefined;
        this.websocketInstance = undefined;
        return this.connect().then((websocket: WebSocket) => {
            this.reconnectListener(this);
            return websocket;
        });
    }

    /**
     * Initialize an websocket connection.
     */
    protected connect(): Promise<WebSocket> {
        if (this.websocketInitializationPromise) {
            return this.websocketInitializationPromise;
        }

        this.websocketInitializationPromise = new Promise((resolve, reject) => {
            const socket = new WebSocket(`wss://${this.websocketUrl}?token=${this.token}&uuid=${this.uuid}`);

            // Connection opened
            socket.onopen = (e) => this.onOpen(socket, e);
            socket.onclose = (e) => this.onClose(e);
            socket.onerror = (e) => this.onError(e);
            // Listen for messages
            socket.onmessage = (event) => {
                this.onMessage(socket, resolve, reject, event);
            };
        });

        return this.websocketInitializationPromise;
    }

    /**
     * Websocket on open event.
     *
     * @param socket
     * @param event
     */
    private onOpen(socket: WebSocket, event: Event) {
        if (this.options.debug) {
            // tslint:disable-next-line
            console.log(`[LARASOCKET DEBUG]: onopen -> `, event);
        }

        // Warning: can't use this.send. we are still in the initialization process.
        socket.send(JSON.stringify(new LinkMessage(this.token, this.uuid).toNetworkJson()));
    }

    /**
     * Websocket on close event. Larasocket will attempt to reconnect.
     *
     * @param event
     */
    private onClose(event: CloseEvent) {
        const timeout = this.getTimeout();
        if (this.options.debug) {
            // tslint:disable-next-line
            console.log(`[LARASOCKET DEBUG]: onclose -> `, event);
            // tslint:disable-next-line
            console.log(`Reconnecting in ${timeout / 1000}s`);
        }

        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        this.currentTimeout = setTimeout(() => this.reconnect(), timeout);
    }

    /**
     * Websocket on error event. Larasocket will close the connection and reconnect.
     *
     * @param event
     */
    private onError(event: Event) {
        if (this.options.debug) {
            // tslint:disable-next-line
            console.log(`[LARASOCKET DEBUG]: onerror -> `, event);
            // tslint:disable-next-line
            console.log(`Error encountered. Closing socket.`);
        }

        this.close();
    }

    /**
     * Websocket on message event. Routed to the listener after the websocket connection can be linked to Larasocket backend.
     *
     * @param socket
     * @param resolve
     * @param reject
     * @param event
     */
    private onMessage(socket: WebSocket, resolve: (t: any) => void, reject: (t: any) => void, event: MessageEvent) {
        if (this.options.debug) {
            // tslint:disable-next-line
            console.log(`[LARASOCKET DEBUG]: onmessage -> `, event);
        }

        const rawMessage = event.data;

        try {
            const rawJson = JSON.parse(rawMessage);

            const message = new IncomingMessage(rawJson);

            if (message.action === IncomingMessageType.LINKED) {
                this.connectionId = message.connectionId!;
                this.websocketInstanceReady(socket);
                resolve(socket);
            } else {
                this.onMessageListener(message);
            }
        } catch (e) {
            reject(e);
        }
    }

    /**
     * Gets the next timeout in milliseconds before the websocket connection should reconnect.
     */
    private getTimeout(): number {
        const nextTimeout = Math.min(this.timeout, 10000); // max 10s timeout.

        this.timeout *= 2; // timeout doubles each time.

        return nextTimeout;
    }

    /**
     * Used to link a socket connection to a db connection.
     */
    private uuidv4() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            // tslint:disable-next-line
            const r = (Math.random() * 16) | 0;
            // tslint:disable-next-line
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }
}
