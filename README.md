## Installation 

```npm i gos-socket-client```

## Using - only for browsers

1. Include javascript libraries [GeniusesOfSymfony/WebSocketBundle](https://github.com/GeniusesOfSymfony/WebSocketBundle/blob/3.x/docs/javascript-client.md#step-1-include-javascript-in-template)
```
<script src="{{ asset('bundles/goswebsocket/js/vendor/autobahn.min.js') }}"></script>
<script src="{{ asset('bundles/goswebsocket/js/websocket.min.js') }}"></script>
```

2. Check in browser console if GosSocket is available
```
console.log(GosSocket);
```

3. Use GoSocketclient

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

