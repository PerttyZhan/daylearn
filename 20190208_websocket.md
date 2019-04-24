# websocket原理

HTTP有1.1和1.0一说，也就是所谓的keep-alive，把多个请求合并为一个，websocket是一个新的协议。

websocket特点：
 1. 建立在TCP协议之上，服务器端的实现比较容易
 2. 与HTTP协议有良好的兼容性，默认端口也是80和443，并且握手阶段采用HTTP协议
 3. 数据格式比较轻量，性能开销小，通信高效
 4. 可以发送文本，也可以发送二进制数据
 5. 没有同源限制
 6. 协议标识是ws，加密是wss

websocket是一个持久化的协议，相对于http这种非持久的协议来说。
http1.0中一个request对应一个response
http1.1中，在一个keep-alive，可以发送多个请求

websocket握手
```
    GET /chat HTTP/1.1
    Host: server.example.com
    Upgrade: websocket
    Connection: Upgrade
    Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
    Sec-WebSocket-Protocol: chat, superchat
    Sec-WebSocket-Version: 13
    Origin: http://example.com
```

```
    upgrade:websocket
`connection:upgrade
```
告诉服务器，我要使用websocket协议

```
    Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==
    Sec-WebSocket-Protocol: chat, superchat
    Sec-WebSocket-Version: 13
```
首先， Sec-WebSocket-Key 是一个 Base64 encode 的值，这个是浏览器随机生成的，告诉服务器：泥煤，不要忽悠我，我要验证你是不是真的是 WebSocket 助理。

然后， Sec_WebSocket-Protocol 是一个用户定义的字符串，用来区分同 URL 下，不同的服务所需要的协议。简单理解：今晚我要服务A，别搞错啦~

最后， Sec-WebSocket-Version 是告诉服务器所使用的 WebSocket Draft （协议版本），在最初的时候，WebSocket 协议还在 Draft 阶段，各种奇奇怪怪的协议都有，而且还有很多期奇奇怪怪不同的东西，什么 Firefox 和 Chrome 用的不是一个版本之类的，当初 WebSocket 协议太多可是一个大难题。。不过现在还好，已经定下来啦~大家都使用同一个版本： 服务员，我要的是13岁的噢→_→