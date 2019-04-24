# HTTP1.0 VS HTTP1.1 VS HTTP2.0

## HTTP1.0 VS HTTP1.1

### 缓存处理
```
 在HTTP1.0主要使用header里的if-modified-since, Expires作为缓存判断的标准，
 HTTP1.1则引入更多的缓存控制策略，如entity tag，if-unmodified-since,if-match,if-none-match等更多的选择的缓存来控制缓存
```
### 带宽优化和网络连接的使用
```
HTTP1.0，存在带宽浪费的现象，例如客户端只需要某个对象的一部分，而服务器却将整个对象返回，并且不支持断点续传功能
HTTP1.1,可以在请求头引入range头域，允许只请求资源的部分，返回码是206（partial content）
```
### 错误通知的管理
```
HTTP1.1增加24个错误状态响应码
```

## HTTP20.0
http2.0主要改进传输性能，实现低延迟和提高吞吐量
多路复用：把http消息分解为互不依赖的帧，然后乱序发送，最后再另一端然后再根据每个帧首部的流标识符重新组装