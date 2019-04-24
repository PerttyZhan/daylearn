问题收集：
  1. 如果给ol.styleIcon设置color，貌似没有效果
  2. ol.style.RegularShape 改变半径的方法
  3. 文字图标的实现


学习：

##  基本组成：
  1. 地图（Map）， 对应ol.Map,入口文件
  2. 视图（View），对应ol.View ，控制地图显示的中心位置，范围，层级等
  3. 图层（layer），对应ol.layer,用于不同业务的图层，每种图层实现都有对应的一个类，
  4. 数据源（source），对应ol.source,和图层一一对应，
  5. 控件（control），对应ol.control，提供和地图交互的入口。保持在地图的某个位置，不会随着地图移动而移动，一直处于地图的最上层
  6. 交互（interaction），对应ol.interaction

## Layer 和 Source

![](./images/ol_layer_Base.png 'layer类图')
![](./images/ol.source.Tile.png 'layer类图')

+ ol.source.Tile 对应的是瓦片数据源，现在网页服务中，绝大数都是使用的瓦片地图
+ ol.source.Image 对应的是一张整图，静态地图
+ ol.source.Vector 对应的是矢量地图源，点线面等常用的地图元素（Feature）

