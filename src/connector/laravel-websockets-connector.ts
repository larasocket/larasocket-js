import {LaravelWebsocketsChannel, LaravelWebsocketsPresenceChannel, LaravelWebsocketsPrivateChannel} from "../channel";
import {Connector} from "laravel-echo/dist/connector";

/**
 * This class creates a connector to a Socket.io server.
 */
export class LaravelWebsocketsConnector extends Connector {
    /**
     * The websocket connection instance.
     */
    websocket: any;

    /**
     * All of the subscribed channel names.
     */
    channels: any = {};

    /**
     * Create a fresh Socket.io connection.
     */
    connect(): void {
        // Create WebSocket connection.
        const socket = new WebSocket('wss://qlsqgawi1i.execute-api.us-east-1.amazonaws.com/WebsocketProxy');

        // Connection opened
        socket.addEventListener('open', function (event) {
            // tslint:disable-next-line
            console.log(event);
            socket.send('Hello Server!');
        });

        // Listen for messages
        socket.addEventListener('message', function (event) {
            // tslint:disable-next-line
            console.log('Message from server ', event.data);
        });

        this.websocket = socket;

        // let ws = this.getWebsocket();
        //
        // this.websocket = new ws(this.options.host);//, this.options);
        //
        // ws.on('open', () => console.log('connected'));
        // ws.on('message', (data: any) => console.log(`From server: ${data}`));
        // ws.on('close', () => {
        //     console.log('disconnected');
        //     process.exit();
        // });

        return this.websocket;
    }

    /**
     * Get socket.io module from global scope or options.
     */
    // getWebsocket(): any {
    //     if (typeof this.options.client !== 'undefined') {
    //         return this.options.client;
    //     }
    //
    //     if (typeof ws !== 'undefined') {
    //         return ws;
    //     }
    //
    //     throw new Error('"ws" client not found. Should be globally available or passed via options.client');
    // }

    /**
     * Listen for an event on a channel instance.
     */
    listen(name: string, event: string, callback: Function): LaravelWebsocketsChannel {
        return this.channel(name).listen(event, callback);
    }

    /**
     * Get a channel instance by name.
     */
    channel(name: string): LaravelWebsocketsChannel {
        if (!this.channels[name]) {
            this.channels[name] = new LaravelWebsocketsChannel(this.websocket, name, this.options);
        }

        return this.channels[name];
    }

    /**
     * Get a private channel instance by name.
     */
    privateChannel(name: string): LaravelWebsocketsPrivateChannel {
        if (!this.channels['private-' + name]) {
            this.channels['private-' + name] = new LaravelWebsocketsPrivateChannel(this.websocket, 'private-' + name, this.options);
        }

        return this.channels['private-' + name];
    }

    /**
     * Get a presence channel instance by name.
     */
    presenceChannel(name: string): LaravelWebsocketsPresenceChannel {
        if (!this.channels['presence-' + name]) {
            this.channels['presence-' + name] = new LaravelWebsocketsPresenceChannel(
                this.websocket,
                'presence-' + name,
                this.options
            );
        }

        return this.channels['presence-' + name];
    }

    /**
     * Leave the given channel, as well as its private and presence variants.
     */
    leave(name: string): void {
        let channels = [name, 'private-' + name, 'presence-' + name];

        channels.forEach((name) => {
            this.leaveChannel(name);
        });
    }

    /**
     * Leave the given channel.
     */
    leaveChannel(name: string): void {
        if (this.channels[name]) {
            this.channels[name].unsubscribe();

            delete this.channels[name];
        }
    }

    /**
     * Get the socket ID for the connection.
     */
    socketId(): string {
        return this.websocket.id;
    }

    /**
     * Disconnect Socketio connection.
     */
    disconnect(): void {
        this.websocket.disconnect();
    }
}
