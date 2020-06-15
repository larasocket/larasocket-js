export enum ChannelSubscriptionStatus {
    PENDING, CONNECTED
}

/**
 * SocketMessage
 */
export class ChannelSubscription {
    /**
     * Event namespace.
     */
    id: number;

    /**
     * Event namespace.
     */
    channel: string;

    /**
     *
     */
    connectionId: string;

    /**
     * Event namespace.
     */
    status: ChannelSubscriptionStatus;

    /**
     * Create a new class instance.
     */
    constructor(rawJson: any = {}) {
        this.id = rawJson.id;
        this.channel = rawJson.channel_name;
        this.connectionId = rawJson.connection_id;
        this.status = ChannelSubscriptionStatus.PENDING;
    }
}
