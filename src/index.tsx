import {Session} from 'autobahn';
import { ClientOptions } from './client-options';
import {InnerMessage} from "./message";

// https://github.com/GeniusesOfSymfony/WebSocketBundle/blob/v3.9.0/docs/javascript-client.md
type ConnectionStatus = 'connected' | 'notConnected' | 'connecting';
type OnSubscribe<Msg> = (uri: string, payload: InnerMessage<Msg>) => void;

export class GosSocketClient<Msg, Topic extends string> {
    private static instances = new Map<string, GosSocketClient<unknown, string>>();
    static defaultUrl: string|undefined = undefined;

    protected connectionStatus: ConnectionStatus = 'notConnected';
    protected session: Session|null = null;
    protected debug = true;

    private url: string;
    private subscribers: Map<Topic, OnSubscribe<InnerMessage<Msg>>> = new Map();
    private isFirstConnect = true;
    protected options: ClientOptions<Topic>;

    protected constructor(options: ClientOptions<Topic>) {
        this.options = options;
        const requiredUrl = options.url ? options.url : GosSocketClient.defaultUrl;
        if (!requiredUrl) {
            throw new Error('GosSocketClient: url is not set. Pass url argument or set GosSocketClient.defaultUrl ' +
                'first');
        }

        this.url = requiredUrl;
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const webSocket = GosSocket.connect(requiredUrl);
        this.connectionStatus = 'connecting';

        webSocket.on('socket/connect', (session: Session) => {
            this.session = session;
            this.connectionStatus = 'connected';
            if (!this.isFirstConnect) {
                this.reInitSubscribers();
            }

            if (options.disablePing !== false) {
                this.startPing();
            }
        });

        webSocket.on('socket/disconnect', (error: string) =>  {
            this.log(error);
            this.isFirstConnect = false;
            this.connectionStatus = 'notConnected';
            this.destroySession();
        });
    }

    static getInstance = (options: ClientOptions<any>): GosSocketClient<unknown, string> => {
        const requiredUrl = options.url ? options.url : this.defaultUrl;
        if (!requiredUrl) {
            throw new Error('Url is not filled. Please pass url parameter or set WsClient.default url first');
        }

        let wsClient = this.instances.get(requiredUrl);
        if (!wsClient) {
            wsClient = new GosSocketClient(options);
            this.instances.set(requiredUrl, wsClient);
        }

        return wsClient;
    }

    destroySession = (): void => {
        if (this.session) {
            this.session = null;
        }
    }

    getSession = (): Promise<Session> => new Promise<Session>((resolve, _reject) => {
        if (this.session && this.connectionStatus === 'connected') {
            resolve(this.session);
        }

        const interval = setInterval(() => {
            if (this.session && this.connectionStatus === 'connected') {
                resolve(this.session);
                clearInterval(interval);
            }
        }, 100);
    });

    startPing = () => {
        const {pingChannel} = this.options;
        setInterval(() => {
            this.publish(pingChannel, {message: 'ping'});
        }, 15000);
    }


    subscribe = async (topic: Topic, onSubscribe: OnSubscribe<InnerMessage<Msg>>)
        : Promise<boolean> => new Promise((resolve, reject) => {
        this.subscribers.set(topic, onSubscribe);
        // the callback function in 'subscribe' is called everytime an event is published in that channel.
        this.getSession().then((session) => {
            session.subscribe(topic, (uri: string, payload: InnerMessage<Msg>) => {
                onSubscribe(uri, payload);
                resolve(true);
            });
        }).catch(reject);
    })

    unsubscribe = (topic: Topic): void => {
        this.subscribers.delete(topic);
        if (this.isConnect(topic)) {
            try {
                // @ts-ignore
                this.session?.unsubscribe(topic);
            } catch (err) {
                console.error(err); // eslint-disable-line no-console
                // can throw error unsubscribe
            }
        }
    };

    isConnect = (topic: Topic): boolean => Boolean(this.session) && Boolean(this.subscribers.get(topic));

    publish = (topic: Topic, msg: InnerMessage<Msg>): void => {
        this.getSession().then(session => {
            // @ts-ignore
            session.publish(topic, msg);
        });
    };

    close = (): void => {
        this.session = null;
    }

    log = (msg: string): void => {
        if (!this.debug) {
            return;
        }
        console.debug(msg); // eslint-disable-line no-console
    };


    static destroy = (options: ClientOptions<any>): void => {
        const instance = this.getInstance(options);
        if (!instance) {
            return;
        }

        instance.unsubscribeAll();
        instance.close();
    };

    destroy = (): void => {
        this.unsubscribeAll();
        this.close();
    };

    private reInitSubscribers = (): void => {
        this.subscribers.forEach((subscriber, topic) => {
            this.subscribe(topic, subscriber);
        });
    }

    private unsubscribeAll = (): void => {
        this.subscribers.forEach((subscriber, topic) => {
            this.unsubscribe(topic);
        });
    };
}
