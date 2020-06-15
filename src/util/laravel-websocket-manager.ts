import {SocketMessage} from "./socket-message";
import {ChannelSubscription} from "./channel-subscription";
import {LaravelWebsocketsChannel} from "../channel";
import {EventFormatter} from "./event-formatter";

/**
 * Event name formatter
 */
export class LaravelWebsocketManager {

    /**
     *
     */
    protected websocketInstance: WebSocket;

    /**
     *
     */
    protected listeners: { [key:string]: (message: SocketMessage) => void };

    /**
     * The event formatter.
     */
    protected eventFormatter: EventFormatter;

    /**
     * Create a new class instance.
     */
    constructor(options: any) {
        this.listeners = {};
        this.eventFormatter = new EventFormatter(options.namespace);

        const socket = new WebSocket('wss://wss.zachvv.me');

        // Connection opened
        socket.addEventListener('open', (event) => {
            // tslint:disable-next-line
            console.log(event);

            socket.send('Hello Server!');
        });

        // Listen for messages
        socket.addEventListener('message', (event) => {
            const message: SocketMessage = new SocketMessage(JSON.parse(event.data));
            this.route(message);
        });

        this.websocketInstance = socket;
    }

    subscribe(channel: LaravelWebsocketsChannel): Promise<ChannelSubscription> {
        return axios.post('http://larasock.test/api/channel-subscriptions', {
            'channel_name': channel.name,
            'connection_id': 'abc'
        }).then((response: any) => {
            return new ChannelSubscription(response.data);
        });
    }

    unsubscribe(channel: LaravelWebsocketsChannel) {
        if (channel.isConnected()) {
            return axios.delete(`http://larasock.test/api/channel-subscriptions/${channel.subscription.id}`);
        }
    }

    on(name: string, listener: (message: SocketMessage) => void) {
        const formattedEventName = this.eventFormatter.format(name);

        this.listeners[formattedEventName] = listener;
    }

    protected route(message: SocketMessage) {
        // tslint:disable-next-line
        console.log('Routing incoming message', message);

        if (! message.event) {
            return;
        }

        const formattedEventName = this.eventFormatter.format(message.event);

        if (this.listeners[formattedEventName]) {
            this.listeners[formattedEventName](message);
        }
    }
}
