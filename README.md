## Installation 

```npm i gos-socket-client```

## Using

```
import {GosSocketClient} from "gos-socket-client";

const wsOptions = {
    url: 'wss://my-web.test/websocket',
    pingChannel: 'ping/channel',
};

const ws = GosSocketClient.getInstance(wsOptions);
ws.subscribe('myChat/channel', () => {});
ws.publish('myChat/channel', {
    msg: 'Hello world',
});
ws.unsubscribe('myChat/channel');

```

