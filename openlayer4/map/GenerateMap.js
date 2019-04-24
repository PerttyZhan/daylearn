/**
 * Created by tangwenjing on 2017/10/9.
 */
// define('gais/map/GenerateMap', ['ol', 'gais/map/GenerateLayer', 'gais/map/Animate', 'proj4'],
//     function (ol, GenerateLayer, Animate, proj4) {
    import ol from './ol'
    import GenerateLayer from './GenerateLayer'
    import Animate from './Animate'
    import proj4 from './proj4'
        var ThematicMap = function (opts) {
            ol.Object.call(this);
            this.json = opts.json || {};
            this.map = opts.map || '';
            this.engineUrl = opts.engineUrl || '';
            //引擎地址
            this.gisContext = opts.gisContext || '';
            //业务地址
            this.sysContext = opts.sysContext || '';
            //代理地址
            this.proxyContext = opts.proxyContext || '';
            //状态恢复方式的标识，是前端恢复还是后端恢复；
            this.infoType = opts.infoType || "frontType";
            this.wsUrl = opts.wsUrl || ""
            //    添加一个记录操作对象
			
			this.featureDataUrl = opts.featureDataUrl ||'';  //业务获取数据透传接口url；
        };
        ol.inherits(ThematicMap, ol.Object);

        ThematicMap.prototype.init = function (flag) {
            this.view = null;
            this.crs = null;
            this.center = [];
            this.projection = null;
            this.mapProjection = null;
            this.changeWithExtentObj = {};
            //优化范围变更重新请求数据，以前为一个个变更，现在更改为存放在这个数组中，最后一次请求；
            this.updateLayerNum = 0;
            this.updateExtentArr = [];
            this.mapInfo = this.json['map'];
            if (this.mapInfo && this.mapInfo.crsProj) {
                this.crsProj = this.mapInfo.crsProj;
            } else {
                this.crsProj = null;
            }
            //    初始化图层管理器
            this.layerManager = new GenerateLayer({
                json: this.json,
                engineUrl: this.engineUrl,
                gisContext: this.gisContext,
                sysContext: this.sysContext,
                proxyContext: this.proxyContext,
				featureDataUrl: this.featureDataUrl
            });
            this.layerManager.init();
            //    添加图层管理器的监听事件
            this.addLayerManagerListener();
            if (flag) {
                this.addMapLisener();
            }

            this.animateManage = new Animate({
                json: this.json
            })
            this.animateManage.init();
            this.addAnimateListener();

            //用于检查用户执行放大、缩小、平移的频率；
            this.myDate = new Date();
            this.operateMapF = [];

            //初始化websocket
            // var sockjs = new SockJS(this.wsUrl);
            // this.stompClient = Stomp.over(sockjs);
            //认证信息；
            this.stompHeader = {
                login: '',
                passcode: ''
            }

            this.time = new Date().getTime();
        }

        //添加动画效果管理模块的监听
        ThematicMap.prototype.addAnimateListener = function () {
            var _this = this;
            if (this.animateManage) {
                //动画效果需要重新绘制地图；
                this.animateManage.on('render-map', function () {
                    _this.map.render();
                })
                //闪烁持续时间达到
                // this.animateManage.on('blink-end', function (param) {
                this.animateManage.on('animate-end', function (param) {
                    if (param && param['param'] && param['param']['key']) {
                        var key = param['param']['key'];
                        ol.Observable.unByKey(key);
                        var paramKey = param['param']['paramKey'];
                        //移除该对象；
                        if (paramKey && _this.layerManager) {
                            _this.layerManager.removeAnimate(paramKey);
                        }
                        // _this.map.unByKey(key);
                    }
                })
                //扩散持续时间达到；
                this.animateManage.on('wave-end', function (param) {
                    if (param && param['param'] && param['param']['key']) {
                        var key = param['param']['key'];
                        ol.Observable.unByKey(key);
                        // _this.map.unByKey(key);
                    }
                })

                //    修改参数
                this.animateManage.on('update-animate-param', function (param) {
                    if (param && param['param']) {
                        var params = param['param'];
                        if (params && _this.layerManager) {
                            _this.layerManager.updateAnimateParam(params);
                        }
                    }
                })
            }
        }
        //判断延时操作
        ThematicMap.prototype.operateFrenquency = function (type) {
            var operObj = {};
            if (this.operateMapF.length > 0) {
                //先置空，后记录；
                var oldTime = this.operateMapF[0]['time'];
                clearTimeout(oldTime);
                this.operateMapF.length = 0;
            }
            var _this = this;
            var time = setTimeout(function () {
                //   1. 到达指定时间，执行代码，并将这些相关参数在执行完操作后清
                _this.compareExtent(type);
                //    2.清空
                _this.operateMapF.length = 0;
            }, 500);
            operObj['time'] = time;
            this.operateMapF.push(operObj);
        }
        //    map view添加监听事件
        ThematicMap.prototype.addMapLisener = function () {
            var _this = this;
            if (!this.view) {

                if (this.map && this.map instanceof ol.Map) {
                    this.view = this.map.getView();
                }
            }
            if (this.view && this.view instanceof ol.View) {
                this.view.on('change:resolution', function () {
                    _this.operateFrenquency("resolution");
                })
                this.view.on('change:center', function () {
                    _this.operateFrenquency("center");
                })
            }
            // if (this.map && this.map instanceof ol.Map) {
            //     if (!this.view) {
            //         this.view = this.map.getView();
            //     }
            //     var _this = this;
            //     this.map.getView().on('change:center', function () {
            //         _this.compareExtent();
            //         // var type = "center";
            //         // _this.countFenquency(type);
            //     })
            //
            //     this.map.getView().on('change:resolution', function () {
            //         // var type = "resolution";
            //         // _this.countFenquency(type);
            //         //不比较范围是否超图均要重新获取；
            //         var flag = true;
            //         _this.compareExtent(flag);
            //     })
            // }
        }
        ThematicMap.prototype.caculateDeltaTime = function (type) {
            var length = this.operateMapF;
            var _this = this;
            var deltaTime = this.operateMapF[length - 1] - this.operateMapF[length - 2];
            if (deltaTime > 1500) {
                //   执行回调
                this.doCompareExtent(type);
                this.operateMapF.length = 0;
            } else {
                setTimeout(_this.lastOperate(length, type), 1500);
            }
        }
        ThematicMap.prototype.lastOperate = function (length, type) {
            if (this.operateMapF.length == length) {
                this.doCompareExtent(type);
                this.operateMapF.length = 0;
            } else {
                this.caculateDeltaTime(type);
            }

        }
        ThematicMap.prototype.doCompareExtent = function (type) {
            if (type == "resolution") {
                var flag = true;
                this.compareExtent(flag);
            } else {
                this.compareExtent();
            }
        }
        //计算范围变化，主要用于计算聚合图层与热力图层数据源的更新
        ThematicMap.prototype.compareExtent = function (flag) {
            if (this.map && this.changeWithExtentObj) {
                var size = this.map.getSize();
                // var extent = this.map.getView().getProjection().getExtent();
                var extent = this.map.getView().calculateExtent(size);
                //地图范围一发生变化，立马变更图层管理器中的地图范围大小；
                if (this.layerManager) {
                    this.layerManager.setMapViewOptions({extent: extent, size: size});
                }
                //clusterOl：前端聚合图层，clusterRest：后端聚合图层，heatmapOl：前端热力图层，heatmapRest：后端热力图层
                var arr = ["clusterOl", "clusterRest", "heatmapOl", "heatmapRest", "vector"];
                for (var i = 0; i < arr.length; i++) {
                    var type = arr[i];
                    this.updateChangeObj(type, extent, flag);
                }
                if (this.updateExtentArr.length) {
                    this.updateLayerExtent(this.updateExtentArr);
                }
                //    清空改数组
                // this.updateExtentArr.length = 0;
            }
        }
        //组织已经变化的对象，替换变化的范围，更新大对象中的变更的范围
        ThematicMap.prototype.updateChangeObj = function (type, extent, opt) {
            if (this.changeWithExtentObj.hasOwnProperty(type)) {
                var obj = this.getChangeObj(type, extent, opt);
                var flag = this.isEmpty(obj);
                if (this.layerManager && !flag) {
                    var obj = {extent: extent, obj: obj, type: type, operateType: "extentUpdate"}
                    this.updateExtentArr.push(obj);
                    // this.layerManager.updateLayerExtent({extent: extent, obj: obj, type: type})
                }
            }
        }
        //组织完变更的图层后，一起向数据源模块发请求；
        ThematicMap.prototype.updateLayerExtent = function (arr) {
            if (arr && arr.length) {
                for (var i = 0; i < arr.length; i++) {
                    var item = arr[i];
                    this.layerManager.updateLayerExtent(item);
                }
            }
        }
        //判断对象是否为空；
        ThematicMap.prototype.isEmpty = function (obj) {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * 范围变化，计算一下哪些图层超出了范围，放入一个新的对象当中，用于重新计算这些新图层；
         * @param type
         * @param extent
         * @param opt
         * @returns {{}}
         */
        ThematicMap.prototype.getChangeObj = function (type, extent, opt) {
            var obj = this.changeWithExtentObj[type];
            var objs = {};
            if (obj) {
                for (var i in obj) {
                    var item = obj[i];
                    var observeExtent = item['observeExtent'];
                    var flag;
                    //只有设置随着范围变化，更新的数据源的才会更新；
                    if (observeExtent) {
                        var elemExtent = item['extent'];
                        if (opt) {
                            flag = false;
                        } else {
                            flag = this.hasContain(elemExtent, extent);
                        }
                        //判断范围
                        var res = this.view.getResolution();
                        var resFlag = this.layerManager.compareRes(item['maxRes'], item['minRes'], res);
                        if (!flag && resFlag) {
                            var ratio = item['ratio'];
                            var newExtent = this.layerManager.caculateExtent(ratio, extent);
                            //    更新对象
                            // this.changeWithExtentObj['clusterRest'][i]['extent'] = newExtent;
                            this.changeWithExtentObj[type][i]['extent'] = newExtent;
                            item['extent'] = newExtent;
                            //    分类放置变化对象
                            objs[item['id']] = item;
                        }
                    }
                }
            }
            return objs;
        }
        /**
         * 判断地图当前视图分辨率是否落于特定最大小分辨率之间；
         * @param maxRes
         * @param minRes
         * @returns {boolean}
         */
        ThematicMap.prototype.compareRes = function (maxRes, minRes) {

            if (this.view && this.view instanceof ol.View) {
                var res = this.view.getResolution();
                if (!maxRes && !minRes) {
                    return true;
                } else if (maxRes && minRes) {
                    if (res && res >= minRes && res <= maxRes) {
                        return true;
                    }
                } else {
                    if (maxRes) {
                        if (res && res <= maxRes) {
                            return true;
                        }
                    } else {
                        if (res && res >= minRes) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        //判断一个范围是否包含另一个范围；
        ThematicMap.prototype.hasContain = function (extent1, extent2) {
            if (extent1 && extent1.length && extent2 && extent2.length) {
                var flag = ol.extent.containsExtent(extent1, extent2);
                return flag;
            } else {
                return false;
            }
        }
        //生成专题地图方法
        ThematicMap.prototype.generateThematicMap = function () {
            //初始化地图
            if (this.mapInfo && this.map) {
                //设置空间参考
                this.crs = this.mapInfo.crs;
                //组织view
                this.formateView(this.mapInfo);

                //地图设置view
                this.map.setView(this.view);

                this.addMapLisener();
                //为图层管理器传递地图范围大小参数
                this.setMapViewOption(this.map);
                if (this.layerManager) {
                    //设置地图投影,有的图层设置需要地图投影信息；
                    this.setMapProjection();
                    //生成图层组
                    this.layerManager.formateLayerGroup();
                    //生成单一图层
                    this.layerManager.formateSingleLayer(this.projection);
                }
            }
        }
        //设置地图的投影
        ThematicMap.prototype.setMapProjection = function () {
            if (this.map && this.map instanceof ol.Map) {
                var projection = this.map.getView().getProjection();
                if (this.layerManager && projection) {
                    this.layerManager.setMapProjection(projection)
                }
            }
        }
        //获取生成样式接口
        ThematicMap.prototype.generateStyle = function (styleId, field, feature, map) {
            //单纯调用生成样式接口，样式中需要地图参数，提供map参数入口；
            if (map && map instanceof ol.Map) {
                this.setMapViewOption(map);
            }
            if (this.layerManager) {
                return this.layerManager.generateStyle(styleId, field, feature);
            }

        }
        //生成单一图层方法
        ThematicMap.prototype.generateSingleLayer = function () {
            if (this.layerManager) {
                //设置地图投影,有的图层设置需要地图投影信息；
                this.setMapProjection();
                var layers = this.layerManager.generateSingleLayer();
                return layers;
            }
        }
        //生成图层组
        ThematicMap.prototype.generateLayerGroup = function () {
            if (this.layerManager) {
                //设置地图投影,有的图层设置需要地图投影信息；
                this.setMapProjection();
                this.layerManager.generateLayerGroup();
            }
        }
        //设置地图视图参数，传递给layermanager
        ThematicMap.prototype.setMapViewOption = function (map) {
            if (map && map instanceof ol.Map) {
                var view = map.getView();
                var size = map.getSize();
                var res = view.getResolution();
                var extent = map.getView().calculateExtent(size);
                // var extent = view.getProjection().getExtent();
                // var size = this.map.getSize();
                if (this.layerManager) {
                    this.layerManager.setMapViewOptions({extent: extent, size: size, res: res});
                }
            }
        }
        //组织像素坐标参数；
        ThematicMap.prototype.formatePixelsCrs = function (json, extent) {
            if (!extent) {
                extent = [-0.5, -767.5, 1023.5, 0.5];
            }
            this.projection = new ol.proj.Projection({
                code: 'xkcd-image',
                units: 'pixels',
                extent: extent,
                axisOrientation: 'esu'
            })
            // var
            this.imageExtent = extent;
            this.view = new ol.View({
                center: (this.center && this.center.length) ? this.center : ol.extent.getCenter(extent),
                zoom: json.zoomLevel || 1,
                maxZoom: json.maxZoom || 17,
                minZoom: json.minZoom || 0,
                rotation: json.roate || 0, // 视图旋转，弧度
                extent: extent,
                projection: this.projection
                //     new ol.proj.Projection({
                //     units: 'pixels',
                //     extent: extent,
                //     axisOrientation: 'esu'
                // })
            })
            // this.view.fit(extent);
        }
        //组织地理坐标参数
        ThematicMap.prototype.formateGeoCrs = function (json, center) {
            // if (this.crs) {
            //     this.center = this.makeCenterMatch(center);
            // }
            this.getMapProjection();

            this.view = new ol.View({
                center: this.center || [0, 0],
                zoom: json.zoomLevel || 1,
                maxZoom: json.maxZoom || 17,
                minZoom: json.minZoom || 0,
                rotation: json.rotate || 0,
                // projection: this.crs || 'EPSG:3857'
                projection: this.mapProjection || this.crs || 'EPSG:3857'
            })
        }
        /**
         * 如果不是4326也不是3857，则需要自定义坐标信息；
         */
        ThematicMap.prototype.getMapProjection = function () {
            ol.proj.setProj4(proj4);
            if (this.crs != "EPSG:4326" && this.crs != "EPSG:3857" &&
                this.crs != "epsg:3857" && this.crs != "epsg:4326") {
                if (this.crsProj) {
                    proj4.defs(this.crs, this.crsProj);
                    this.mapProjection = ol.proj.get(this.crs);
                    // this.mapProjection.setExtent([-180, -90, 180, 90]);
                }
            }
        }
        ThematicMap.prototype.makeCenterMatch = function (center) {
            if (center[0] >= 0 && center[0] <= 180 && center[1] >= 0 && center[1] <= 90) {
                if (this.crs == "EPSG:3857" || this.crs == "epsg:3857") {
                    var newCenter = ol.proj.fromLonLat(center, this.crs)
                    return newCenter;
                }
            }
        }
        //设置地图view属性；
        ThematicMap.prototype.formateView = function (json, extent) {
            // 需要添加对中心点设置为经纬度，但是crs确为EPSG:3857的判断
            // var center = [];
            if (json && json.center) {
                var stringArr = json.center.split(",");
                for (var i = 0; i < stringArr.length; i++) {
                    this.center[i] = Number(stringArr[i]);
                }
                // this.center = center;
                if (this.crs && this.crs == 'pixels') {
                    this.formatePixelsCrs(json, extent);
                } else {
                    this.formateGeoCrs(json, this.center);
                }
            }
            // this.view.on('change:center',function () {
            //     alert("ssss")
            // })

            this.addMapLisener();

            //地图view设置成功，抛出事件；
            this.dispatchEvent({type: 'set-view-success', param: this.view})
        }
        //是否过滤要素
        ThematicMap.prototype.ifFilterFeature = function (evt) {
            if (this.layerManager) {
                this.layerManager.ifFilterFeature(evt);
            }
        }
        //将所有的图层加入地图当中；
        ThematicMap.prototype.addLayerToMap = function (arr) {
            if (arr && arr.length && this.map) {
                for (var i = 0; i < arr.length; i++) {
                    this.map.addLayer(arr[i]);
                }
            }
        }

        //添加图层管理器监听事件并发送事件
        ThematicMap.prototype.addLayerManagerListener = function () {
            var _this = this;
            //    加载矢量数据成功
            this.layerManager.on('vector-load-success', function (param) {
                //将所有的图层加入地图当中
                _this.addLayerToMap(param['param']['layers']);
                _this.dispatchEvent({type: 'vector-load-success', param: param['param']});
                //获取聚合图层；
                if (param['param'] && param['param']['change']) {
                    //随范围变化的对象；
                    _this.changeWithExtentObj = param['param']['change']
                }
            })
            //获取数据源失败
            this.layerManager.on('get-source-error', function (param) {
                _this.dispatchEvent({type: 'get-source-error', param: param['param']});
            })
            //    请求矢量数据之前，参数事件；
            this.layerManager.on('orgnize-vector-param-success', function (param) {
                _this.dispatchEvent({type: 'orgnize-vector-param-success', param: param['param']})
            })
            //    图层组请求完成后发出的事件
            this.layerManager.on('group-success', function (param) {
                //    将图层组添加至地图当中
                var group = param['param'];
                _this.addGroupToMap(group);
                _this.dispatchEvent({type: "group-success", param: param['param']})
            })
            //    图像图层取到范围发出的事件
            this.layerManager.on('image-extent-change', function (param) {
                var extent = param['param'];
                _this.setImageView(extent);
            })
            //调整地图范围
            this.layerManager.on('adjust-map-extent', function (param) {
                if (param && param['param'] && param['param']['extent'] && param['param']['extent'].length) {
                    var extent = param['param']['extent'];
                    _this.setImageView(extent);
                }
            })
            //    获取要素成功发出的事件
            this.layerManager.on('vector-load-feature-success', function (param) {
                _this.dispatchEvent({type: 'vector-load-feature-success', param: param['param']});
            })
            //    要素全部加载完成
            this.layerManager.on('load-feature-success', function (param) {
                _this.dispatchEvent({type: 'load-feature-success', param: param['param']});
                //    恢复地图要素状态
                _this.recoveryFeatureStatus();
            })
            //    监听动画效果生成请求事件
            this.layerManager.on('generate-animate-request', function (param) {
                if (_this.animateManage && param && param['param'] && param['param']['param'] && param['param']['paramKey']) {
                    var paramKey = param['param']['paramKey'];
                    var obj = param['param']['param'][paramKey];
                    var style = param['param']['style'];
                    if (obj) {
                        var feature = obj['feature'];
                        var flushFlag = obj['flushFlag'];
                        var startTime = obj['startTime'];
                        var baseTime = obj['baseTime'];
                        if (feature instanceof ol.Feature) {
                            (function (param) {
                                var key = _this.map.on("postcompose", function (event) {
                                    _this.animateManage.generateAnimate(event, param, key);
                                    //动画对象添加事件可以值
                                    _this.layerManager.addMapEventKey(param, key);
                                })
                            })(param)
                        }
                    }
                }
            })
            // this.layerManager.on('remove-feature-animate',function (param) {
            //     var key = param['param'];
            //     if(key){
            //         ol.Observable.unByKey(key);
            //     }
            // })

            this.layerManager.on('animate-end', function (param) {
                if (param && param['param'] && param['param']['key']) {
                    var key = param['param']['key'];
                    ol.Observable.unByKey(key);
                    var paramKey = param['param']['paramKey'];
                    //移除该对象；
                    if (paramKey && _this.layerManager) {
                        _this.layerManager.removeAnimate(paramKey);
                    }
                    // _this.map.unByKey(key);
                }
            })

            function test(id) {
                // console.log('in test '+id);
            }

            //    地图范围变更后，监听数据获取成功，恢复状态用的
            this.layerManager.on("update-extent-source-success", function (param) {
                _this.updateLayerNum++;
                if (_this.updateLayerNum == _this.updateExtentArr.length) {
                    _this.updateLayerNum = 0;
                    _this.updateExtentArr.length = 0;
                    if (_this.layerManager) {
                        _this.layerManager.recoveryFeatureByObj();
                    }
                }
            })
        }
        //恢复状态方式
        ThematicMap.prototype.recoveryFeatureStatus = function () {
            if (this.infoType == "frontType") {
                this.dispatchEvent({type: 'please-update-feature-status', param: {}})
            } else if (this.infoType == "backendType") {
                // this.stompClient.connect(this.stompHeader, this.wsCallback, this.wsError);
            }
        }
        //websocket获取后端数据后回调
        ThematicMap.prototype.wsCallback = function () {
            var _this = this;
            //恢复状态；
            // this.stompClient.subscribe('/topic/web/recovery', function (event) {
            //     var data = event.data;
            //     _this.updateStatus(data);
            // })
        }
        ThematicMap.prototype.wsError = function (msg) {
            //通知业务连接失败；
            this.dispatchEvent({type: 'stomp-connect-error', param: msg})
        }
        //后端获取数据恢复状态
        ThematicMap.prototype.updateStatus = function (data) {
            if (this.layerManager) {
                this.layerManager.updateStatus(data);
            }
        }
        //添加图层组至地图当中，如果map为空，则返回该图层组数组；
        ThematicMap.prototype.addGroupToMap = function (group) {
            if (this.map) {
                // this.addGroupToMap(this.layerGroupArr);
                if (group && group.length) {
                    for (var i = 0; i < group.length; i++) {
                        var sub = group[i];
                        if (i == 0) {
                            sub.setVisible(true);
                        } else {
                            sub.setVisible(false);
                        }
                        this.map.addLayer(sub);
                    }
                    // this.map.setLayerGroup(group[0]);
                }
            } else {
                return group;
            }
        }
        //如果是静态图片，则更新地图的范围与中心点；
        ThematicMap.prototype.setImageView = function (extent) {

            if (this.map && extent && extent.length) {
                if (this.mapInfo) {
                    this.formateView(this.mapInfo, extent);
                    this.map.setView(this.view);
                } else {
                    this.map.getView().fit(extent);
                }

                // var view = this.map.getView();
                // var view = new ol.View({
                //     center:[0,0],
                //     zoom:1,
                //     extent:extent
                // })
                // view.fit(extent);


                // var center = ol.extent.getCenter(extent);
                // view.setCenter(center);
                // view.fit(extent);
                // this.map.getView().getProjection().setExtent(extent);
                // this.map.updateSize();
            }
        }
        //更新要素样式
        ThematicMap.prototype.updateStyle = function (param) {
            if (this.layerManager) {
                this.layerManager.updateStyle(param);
            }
            // if (code && workspace && this.layerManager) {
            //     this.layerManager.updateStyle(code, workspace)
            // }
        }

        /**
         * 生成动画效果接口
         * @param param{
         * feature:feature,   要素
         * styleId:styleId,   样式id
         * fid:fid,            要素id
         * layerCode:layerCode,   图层编码
         * workspace:workspace,    图层工作空间
         * styles:styles           样式}
         */
        ThematicMap.prototype.generateAnimate = function (param) {
            if (this.layerManager) {
                this.layerManager.reorgnizeStatusParams(param)
            }

        }
        //清空所有的动画
        ThematicMap.prototype.emptyAllAnimate = function () {
            if (this.layerManager) {
                this.layerManager.emptyAllAnimate();
            }
        }

        /**
         * 向第三方的矢量数据源图层添加数据
         * code:图层编码
         * wsCode:图层所在工作空间的编码
         * */
        ThematicMap.prototype.addFeatureToNoneResourceLayer = function (code, wsCode, geoJson) {
            if (this.layerManager) {
                this.layerManager.addFeatureToNoneResourceLayer(code, wsCode, geoJson);
            }
        }

        /**
         * 向通用瓦片图层，添加扩展加载方案
         * @param key     类型
         * @param funcString   计算瓦片块行列号的方法
         */
        ThematicMap.prototype.addLoadFunc = function (key, funcString) {
            if (key && funcString && this.layerManager) {
                this.layerManager.addLoadFunc(key, funcString);
            }
        }
        ThematicMap.prototype.setLayerVisiable=function(code,wsCode,visiable){
          var layer=this.layerManager.findLayerByCodeAndWorkspace(code,wsCode);
          this.layerManager.setVisible({visible:visiable},layer);
        } 
        // 根据图层来获取style
        ThematicMap.prototype.getLayerStyleConfId=function (code,wsCode) {
          return this.layerManager.getStyleId(code,wsCode);
        } 
    //     return ThematicMap;
    // })
    export default ThematicMap
