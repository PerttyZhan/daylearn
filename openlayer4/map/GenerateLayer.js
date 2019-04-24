/**
 * Created by tangwenjing on 2017/10/9.
 */
// define('gais/map/GenerateLayer', [
//         'ol',
//         'gais/map/GenerateStyle',
//         'gais/map/GenerateSource',
//         'proj4',
//         'gais/map/Ajax'],
//     function (ol, GenerateStyle, GenerateSource, proj4, Ajax) {
    import ol from './ol'
    import GenerateStyle from './GenerateStyle'
    import GenerateSource from './GenerateSource'
    import proj4 from './proj4'
    import Ajax from './Ajax'
        var GenerateLayer = function (opts) {
            ol.Object.call(this);
            this.json = opts.json || {};
            //
            this.engineUrl = opts.engineUrl || '';
            //业务地址
            this.sysContext = opts.sysContext || '';
            //gis引擎地址
            this.gisContext = opts.gisContext || '';
            //代理地址
            this.proxyContext = opts.proxyContext || '';
			
			//业务获取数据透传接口url
			this.featureDataUrl= opts.featureDataUrl ||'';
        }
        ol.inherits(GenerateLayer, ol.Object);
        /**
         * 初始化
         */
        GenerateLayer.prototype.init = function () {

            //单一图层长度标识；
            this.singleLayerFlag = false;
            //矢量图层
            this.layerObjArr = [];
            this.vectorObj = {};
            this.vectorAllObj = {};
            this.layer = this.json['layer'];
            this.layerGroup = this.json['layer_group'];
            this.mapLayerRel = this.json['map_layer_rel'];
            this.layerImage = this.json['layer_image'];
            this.layerTile = this.json['layer_tile'];
            this.layerVector = this.json['layer_vector'];
            this.layerCluster = this.json['layer_cluster'];  //聚合图层；
            this.layerHeatmap = this.json['layer_heatmap'];  //热力图
            this.layerZoomify = this.json['layer_zoomify'];
            this.mapLayerGroupRel = this.json['map_layer_group_rel'];
            this.layerGroupRel = this.json['layer_group_rel'];
            this.workspace = this.json['workspace'];
            this.styleConf = this.json['style_conf'];
            this.resourceZoomify = this.json['resource_zoomify'];
            this.resourceIcon = this.json['resource_icon'];
            //属性字段样式
            this.styleCategory = this.json['style_category'];
            this.imageExtent = [];
            this.crs = (this.json && this.json['map'] && this.json['map']['crs']) ? this.json['map']['crs'] : "EPSG:3857";

            this.projection = null;
            this.layerProjection = null;

            //变化对象
            this.changeObj = {};
            //热力图
            this.heatmapObj = {};         //后端热力图
            this.heatmapAllObj = {};     //存放后端热力图参数集合；
            this.olHeatmapObj = {};     //前端热力图参数集合，用于获取数据源；
            this.olheatmapAllObj = {}; //存放所有的热力图层参数；

            //聚合图层
            this.clusterSourceObj = {};           //前端聚合图层参数集合，用于获取数据源；
            this.clusterSourceAllObj = {};       //存放所有前端聚合图层参数；
            this.clusterObj = {};               //后端聚合图层；
            this.clusterAllObj = {}            //存放所有的后端聚合参数


            //表示单一图层长度
            this.singleLayerNum = 0;
            //表示非异步图层数量
            this.syncLayerNum = 0;
            //表示异步图层数量
            this.asyncLayerNum = 0;


            // this.viewExtentFlag = false;
            //范围是否调整的标识，如果map监听到了范围变化，该变量会被赋值；
            this.extentAjust = null;
            // 初始化样式
            this.styleManager = new GenerateStyle({
                json: this.json,
                sysContext: this.sysContext,
                gisContext: this.gisContext,
                proxyContext: this.proxyContext
            });
            this.styleManager.init();
            this.addStyleListener();


            // 初始化矢量数据源
            this.sourceManager = new GenerateSource({
                json: this.json,
                engineUrl: this.engineUrl,
                gisContext: this.gisContext,
				featureDataUrl:this.featureDataUrl
            });
            this.sourceManager.init();
            this.addSourceListener();
            //    动画管理对象
            this.animateObj = {};
            /**
             * 提供给自定义坐标系图层使用
             */
            ol.proj.setProj4(proj4);

            this.tileLoadFunc = {};
            this.initLoadFunc();
        };
        /**
         * 是否过滤要素
         * @param evt
         */
        GenerateLayer.prototype.ifFilterFeature = function (evt) {
            if (this.sourceManager) {
                this.sourceManager.ifFilterFeature(evt);
            }
        }
        /**
         * 获取样式事件
         */
        GenerateLayer.prototype.addStyleListener = function () {
            var _this = this;
            //用于存放动画效果的对象；
            var animateObj = {};
            //   监听根据要素id获取要素的请求事件；
            this.styleManager.on('get-feature-by-id', function (param) {
                if (param && param['param'] && param['param']['featureId'] && param['param']['layerCode'] && param['param']['layerWorkspace']) {
                    var feature, layerId;
                    var layer = _this.findLayerByCodeAndWorkspace(param['param']['layerCode'], param['param']['layerWorkspace']);
                    if (layer) {
                        var source = layer.getSource();
                        feature = source.forEachFeature(function (feature) {
                            var id = feature.get('fid');
                            if (id == param['param']['featureId']) {
                                return feature;
                            }
                        })
                        // feature = source.getFeatureById(param['param']['featureId']);
                        layerId = layer.get('id');
                    }
                    //根据要素id获取要素
                    if (feature && layerId) {
                        _this.styleManager.setFeatureParamForStatusStyle(feature, layerId);
                    }

                }
            })
            // 重新组织一下参数使与矢量图层生成样式时参数结构一致；
            this.styleManager.on('generate-animate-request-update', function (param) {
                _this.reorgnizeStatusParams(param);
            })

            //    监听动画效果生成请求事件
            this.styleManager.on('generate-animate-request', function (param) {
                _this.dispatchEvent({type: 'generate-animate-request', param: param['param']})
            })

            //    样式管理器获取图层要求
            this.styleManager.on('get-layer-by-code-workspace', function (param) {
                if (param && param['param']) {
                    _this.getLayerParamForStyleManager(param['param']);
                }
            })
            this.styleManager.on('empty-animate', function (param) {
                if (param && param['param']) {
                    _this.emptyAnimate(param['param']);
                }
            })
        }
        /**
         * 清空动画效果
         * @param param
         */
        GenerateLayer.prototype.emptyAnimate = function (param) {
            var code = param['code'];
            var ws = param['workspace'];
            var feature = param['feature'];
            //判断是否有动画清空动画
            this.emptyFeatureAnimate(feature, code, ws)

        }
        /**
         * 清空所有的动画
         */
        GenerateLayer.prototype.emptyAllAnimate = function () {
            if (this.animateObj) {
                for (var i in this.animateObj) {
                    var obj = this.animateObj[i];
                    if (obj && obj.hasOwnProperty('mapEventKey')) {
                        var mapEventKey = obj['mapEventKey'];
                        ol.Observable.unByKey(mapEventKey);
                    }
                }
            }
        }
        /**
         * 判断要素是否有动画，有动画就清空
         * @param feature
         * @param code
         * @param ws
         */
        GenerateLayer.prototype.emptyFeatureAnimate = function (feature, code, ws) {
            if (feature && feature instanceof ol.Feature) {
                var fid = feature.get('fid');
                var key = fid + "-" + code + "-" + ws;
                if (this.animateObj && this.animateObj.hasOwnProperty(key)) {
                    var obj = this.animateObj[key];
                    if (obj && obj.hasOwnProperty('mapEventKey')) {
                        var mapEventKey = obj['mapEventKey'];
                        //删除对象
                        this.dispatchEvent({
                            type: "animate-end",
                            param: {feature: feature, key: mapEventKey, paramKey: key}
                        })
                        // this.removeAnimate(key);
                        //map 移除监听
                        // this.dispatchEvent({type: 'remove-feature-animate', param: obj});
                    }
                }
            }
        }
        /**
         * 组织图层参数给样式管理器，为重新生成样式提供参数
         * @param param
         */
        GenerateLayer.prototype.getLayerParamForStyleManager = function (param) {
            var cateStyleId, targetStyleId;
            var code = param['code'];
            var ws = param['workspace'];
            var feature = param['feature'];
            //判断是否有动画清空动画
            this.emptyAnimate(param);
            // this.emptyFeatureAnimate(feature, code, ws)
            if (code && ws) {
                var layer = this.findLayerByCodeAndWorkspace(code, ws);
                if (layer) {
                    var id = layer.get('id');
                    if (this.layer && id) {
                        var item = this.layer[id];
                        if (item) {
                            var infoId = item['infoId'];
                            if (this.layerVector) {
                                var elem = this.layerVector[infoId];
                                if (elem) {
                                    var field = elem['annoField'];
                                    var styleId = elem['styleId'];
                                    var categoryField = elem['categoryField'];
                                    var layerId = elem['layerId'];
                                    if (categoryField) {
                                        var value = feature.get(categoryField);
                                        cateStyleId = this.getStyleIdByAttribute(value, layerId);
                                    }
                                    if (cateStyleId) {
                                        targetStyleId = cateStyleId;
                                    } else {
                                        targetStyleId = styleId;
                                    }
                                    var animId = this.findAnimId(targetStyleId);
                                    //告知样式管理器这些参数；
                                    if (this.styleManager) {
                                        this.styleManager.setRegnizeStyleParam({
                                            styleId: targetStyleId,
                                            field: field,
                                            feature: feature,
                                            animId: animId
                                        })
                                    }
                                }
                            }
                            // var type= item['type']
                        }
                    }
                }
            }
        }
        /**
         * 根据styleId查找动画id
         * @param styleId
         * @returns {*}
         */
        GenerateLayer.prototype.findAnimId = function (styleId) {
            var animateId;
            if (this.styleConf && this.styleConf[styleId] && this.styleConf[styleId]['animId']) {
                animateId = this.styleConf[styleId]['animId'];
                return animateId;
            }
        }
        /**
         * 抛出加载成功事件
         */
        GenerateLayer.prototype.singleLayerSuccess = function () {
            var _this = this;
            if (_this.singleLayerFlag && _this.layerArr.length) {
                _this.dispatchEvent({
                    type: 'vector-load-success', param: {
                        layers: _this.layerArr, change: {
                            "clusterOl": _this.clusterSourceAllObj,
                            "clusterRest": _this.clusterAllObj,
                            "heatmapOl": _this.olheatmapAllObj,
                            "heatmapRest": _this.heatmapAllObj,
                            "vector": _this.vectorAllObj
                        }
                    }
                });
            }
        }
        /**
         * 获取矢量数据源事件
         */
        GenerateLayer.prototype.addSourceListener = function () {
            var _this = this;
            //获取要素成功后抛出的事件；
            this.sourceManager.on('vector-load-feature-success', function (param) {
                _this.dispatchEvent({type: 'vector-load-feature-success', param: param['param']});
            })

            this.sourceManager.on('get-source-error', function (param) {
                _this.dispatchEvent({type: 'get-source-error', param: param['param']})

            })
            //专题地图有矢量图层且要素加载完成抛出事件；
            this.sourceManager.on('load-vector-success', function () {
                // if (_this.singleLayerFlag && _this.layerArr.length) {
                //     _this.dispatchEvent({
                //         type: 'vector-load-success', param: {
                //             layers: _this.layerArr, change: {
                //                 "clusterOl": _this.clusterSourceAllObj,
                //                 "clusterRest": _this.clusterAllObj,
                //                 "heatmapOl": _this.olheatmapAllObj,
                //                 "heatmapRest": _this.heatmapAllObj,
                //                 "vector": _this.vectorAllObj
                //             }
                //         }
                //     });
                // }
                _this.singleLayerSuccess();
            })
            //    要素全部加载至图层当中抛出的事件
            this.sourceManager.on('load-feature-success', function (param) {
                _this.dispatchEvent({type: 'load-feature-success', param: param['param']})
            })

            // 聚合图层后端生成成功事件
            this.sourceManager.on('generate-cluster-source-success', function (param) {
                _this.setClusterLayerSource(param);
            })

            //    地图范围变更重新请求的数据源完成事件
            this.sourceManager.on('update-extent-source-success', function (param) {
                _this.dispatchEvent({type: 'update-extent-source-success', param: param});
            })
        }
        /**
         * 获取数据源后，将数据源筛入图层当中
         * @param param
         */
        GenerateLayer.prototype.setClusterLayerSource = function (param) {
            if (param && param['layer'] && param['data']) {
                var features = new ol.format.GeoJSON().readFeatures(param['data']);
                param['layer'].getSource().addFeatures(features);
            }
        }
        /**
         * 更新矢量图层对象
         * @param vecLayer
         * @param workspace
         */
        GenerateLayer.prototype.refreshVecLayerObj = function (vecLayer, workspace) {
            this.vecLayerObj.layer = vecLayer;
            this.vecLayerObj.workspace = workspace;
        }
        /**
         * 设置图层属性值
         * @param item
         * @param layer
         */
        GenerateLayer.prototype.setUniqueLayerProperties = function (item, layer) {
            if (item && layer) {
                this.setExtent(item, layer);
                this.setMinRes(item, layer);
                this.setMaxRes(item, layer);
                this.setOpacity(item, layer);
                this.setVisible(item, layer);
            }
        }
        /**
         * 生成非矢量图层，静态图层、瓦片图层等
         * @param item
         */
        GenerateLayer.prototype.generateOtherLayer = function (item) {
            //非异步图层
            // this.singleLayerNum --;
            //统计非异步图层数量；
            this.syncLayerNum++;

            var typeId = item['infoId'];
            var type = item['type'];
            var subType, extent;
            if (type == "layer_tile" && this.layerTile && this.layerTile.hasOwnProperty(typeId)) {
                var elem = this.layerTile[typeId];
                subType = (elem && elem['type']) ? elem['type'] : undefined;
            }
            if (subType == "layer_zoomify" || type == "layer_image") {
                extent = this.setImageExtent(item);
            }

            if (extent && extent.length && type == "layer_image" && !this.extentAjust) {
                //  事件是否被监听标识；
                // this.extentAjust = this.dispatchEvent({type: 'adjust-map-extent', param: {extent: extent}});
            }
            //传递item为image 图层赋名称等属性
            var otherLayer = this.getSingleLayer(type, typeId, extent, item);
            // this.addVecLayerToMap(otherLayer);
            if (otherLayer) {
                this.layerArr.push(otherLayer);
            }
            this.setUniqueLayerProperties(item, otherLayer);
        }
        /**
         * 生成单一图层
         * @param projection
         */
        GenerateLayer.prototype.formateSingleLayer = function (projection) {
            //数组改成对象
            this.layerArr = [];
            this.layersObj = {};
            this.layerProjection = projection;

            //存放后端生成热力图集
            this.heatmapObj = {};
            /* 这里只有单一图层ID并无类型，无法获知图层类型 */
            if (this.mapLayerRel && this.mapLayerRel.length) {
                var _this = this;
                this.singleLayerFlag = false;
                this.singleLayerNum = this.mapLayerRel.length;
                for (var i = 0; i < this.mapLayerRel.length; i++) {

                    (function (i) {
                        var layerId = _this.mapLayerRel[i];
                        var item = _this.layer[layerId];
                        _this.vecLayerObj = {};
                        // _this.singleLayerNum--;
                        if (item['type'] && item['infoId']) {
                            /**
                             *添加第三方数据源矢量图层
                             */
                            if (item['type'] == 'layer_vector' || item['type'] == 'layer_vector_custom') {

                                _this.generateVecLayer(item);
                            } else if (item['type'] == "layer_cluster") {
                                _this.generateClusterLayer(item);
                            } else if (item['type'] == "layer_heatmap") {
                                _this.generateHeatmap(item);
                            } else {
                                _this.generateOtherLayer(item);
                                //判断图层是否加载完成；
                                // _this.estimateLayerFinish();
                            }
                        }
                        if (i == _this.mapLayerRel.length - 1) {
                            _this.singleLayerFlag = true;
                        }
                    })(i)
                }
                //判断是否只有非异步图层；
                if (this.singleLayerNum == this.syncLayerNum) {
                    this.singleLayerSuccess();
                }
                //	请求矢量数据源之前抛出事件；
                this.dispatchEvent({
                    type: 'orgnize-vector-param-success',
                    param: {data: this.layerObjArr, func: this.vectorSourceCallBack, domain: this}
                });
                // 不加载矢量数据或者无矢量数据，直接抛出事件 ，地图加载成功
                if (this.layerObjArr && (this.layerObjArr.length == 0 || this.noVecLayers)
                    && this.singleLayerNum != this.syncLayerNum) {

                    this.dispatchEvent({type: 'vector-load-success', param: '无矢量图层'})
                }
                if (!this.evt) {
                    // 已经全部获取与组织好图层实例的所有数据源结构 ----矢量图层
                    // this.sourceManager.getVectorSource(this.layerObjArr);
                    this.sourceManager.getVectorSource(this.vectorObj);
                }
                // 已经全部获取与组织好图层实例的所有数据源结构 ----矢量图层
                //	this.getVectorSource(this.layerObjArr);
                // 直接调用生成单一图层接口；
                // if (!this.map) {
                //     return this.layerArr;
                // }
                //    发请求获取后端热力图
                this.generateHeatmapByService(this.heatmapObj);
                //    发请求获取前端热力图数据源
                this.generateHeatmapSource(this.olHeatmapObj);

                //    发请求获取前端聚合图层数据源
                this.getClusterSource(this.clusterSourceObj);

                //  发请求获取后端聚合图层
                this.generateClusterSourceByService(this.clusterObj);
                //将所有动态的要素放入一个对象当中
                this.updateChangeObj();

                //    当所有的异步请求结束后
                // this.getAjaxStatus(vectorSource, heatmapService, heatmapSource, clusterSource);
            } else {
                this.dispatchEvent({type: 'vector-load-success', param: '该专题地图无矢量数据'});
            }
        }
        /**
         *更新随范围变更图层对象
         */
        GenerateLayer.prototype.updateChangeObj = function () {
            this.changeObj['heatmapRest'] = this.heatmapObj;
            this.changeObj['heatmapOl'] = this.olHeatmapObj;
            this.changeObj['clusterOl'] = this.clusterSourceObj;
            this.changeObj['clusterRest'] = this.clusterObj;
        }
        /**
         * 后端获取热力图
         * @param obj
         */
        GenerateLayer.prototype.getHeatmapByRest = function (obj) {
            if (this.sourceManager) {
                this.sourceManager.getHeatmapByRest(obj);
            }
        }
        /**
         * 判断对象是否为空
         * @param obj
         * @returns {boolean}
         */
        GenerateLayer.prototype.isEmpty = function (obj) {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    return false;
                }
            }
            return true;
        }
        /**
         * 给要素设置权重
         * @param layer
         * @param field
         */
        GenerateLayer.prototype.addFeatureListener = function (layer, field) {
            layer.getSource().on('addfeature', function (event) {
                var feature = event.feature;
                if (feature && feature instanceof ol.Feature && field) {
                    var weight = feature.get(field);
                    feature.set('weight', weight);
                }
            })
        }
        /**
         * 生成热力图层
         * @param item
         */
        GenerateLayer.prototype.generateHeatmap = function (item) {
            var id = item['infoId'];
            if (id && this.layerHeatmap && JSON.stringify(this.layerHeatmap) != "{}" && this.layerHeatmap[id]) {
                var elem = this.layerHeatmap[id];
                var extent = this.caculateExtent(elem['extentRatio']);
                var type = elem['weightedType'];
                var workspace = this.findWorkspaceById(item['workspaceId']);
                var heatLayer;
                if (type == '0') {
                    //    前端生成
                    var ratio = elem['extentRatio'];
                    var extent = this.caculateExtent(ratio);
                    var gradient = elem['gradient'].replace(/'/g, '').replace(/\s+/g, "").split(',');
                    heatLayer = new ol.layer.Heatmap({
                        name: item['name'],
                        code: item['code'],
                        id: item['id'],
                        workspace: workspace,
                        gradient: gradient || ['#00f', '#0ff', '#0f0', '#ff0', '#f00'],
                        radius: elem['radius'] || 8,
                        blur: elem['blur'] || 15,
                        shadow: elem['shadow'] || 250,
                        //这个范围需要计算
                        // extent: extent,
                        source: new ol.source.Vector()
                        // weight: elem['weight']
                    })
                    //设置前端热力图权重；
                    this.addFeatureListener(heatLayer, elem['weight']);
                    if (this.olHeatmapObj) {
                        var obj = {
                            name: item['name'],
                            code: item['code'],
                            id: item['id'],
                            maxRes: item['maxRes'],
                            minRes: item['minRes'],
                            observeExtent: elem['observeExtent'],
                            workspace: workspace,
                            workspaceId: item['workspaceId'],
                            extentRatio: elem['extentRatio'],
                            extent: extent,
                            weight: elem['weight'],
                            ratio: elem['extentRatio'],
                            layer: heatLayer
                        };
                        //判断分辨率
                        var resFlag = this.compareRes(item['maxRes'], item['minRes'], this.res);
                        if (resFlag) {
                            this.olHeatmapObj[item['id']] = obj;
                        }
                        //存放所有的热力图参数；
                        this.olheatmapAllObj[item['id']] = obj;

                    }
                    //将图层放入数组；
                    this.layerArr.push(heatLayer);

                } else if (type == "1") {
                    heatLayer = new ol.layer.Image({
                        name: item['name'],
                        code: item['code'],
                        id: item['id'],
                        workspace: workspace,
                        source: new ol.source.ImageWMS({
                            url: this.gisContext + "web/wms/hgisHeatmap"
                        })
                    })
                    //    后端生成，组织热力图对象
                    var obj = {
                        code: item['code'],
                        id: item['id'],
                        workspace: workspace,
                        extent: extent,
                        maxRes: item['maxRes'],
                        minRes: item['minRes'],
                        ratio: elem['extentRatio'],
                        observeExtent: elem['observeExtent'],
                        layer: heatLayer
                    }
                    //统计非异步图层数量；
                    this.syncLayerNum++;
                    //将图层放入数组；
                    this.layerArr.push(heatLayer);
                    //判断分辨率
                    var resFlag = this.compareRes(item['maxRes'], item['minRes'], this.res);
                    if (resFlag) {
                        this.heatmapObj[item['id']] = obj;
                    }
                    //为一次向后端请求生成热力图
                    this.heatmapAllObj[item['id']] = obj;
                }
                this.setUniqueLayerProperties(item, heatLayer);
            }
        }
        /**
         * 请求前端热力图数据源
         * @param param
         */
        GenerateLayer.prototype.generateHeatmapSource = function (param) {
            if (this.sourceManager) {
                // this.sourceManager.generateHeatmapSource(param);
                this.sourceManager.getClusterSource(param);
            }
        }
        /**
         * 基于后端生成热力图
         * @param param
         */
        GenerateLayer.prototype.generateHeatmapByService = function (param) {
            if (this.sourceManager) {
                // this.sourceManager.getHeatmapSourceByRest(param);
                this.getHeatmapSourceByRest(param)
            }
        }

        /**
         * 基于后端生成热力图
         * @param param
         */
        GenerateLayer.prototype.getHeatmapSourceByRest = function (param) {
            if (param) {
                var _this = this;
                for (var i in param) {
                    (function (i) {
                        var item = param[i];
                        var extent = item['extent'];
                        if (extent && extent.length && item) {
                            var workspace = item['workspace'];
                            var code = item['code'];
                            var imageWMSSource = new ol.source.ImageWMS({
                                url: _this.gisContext + "web/wms/hgisHeatmap",
                                params: {
                                    'LAYERS': workspace + ":" + code,
                                    'FORMAT': 'png',
                                    // request: "GetMap",
                                    // service: "WMS",
                                    //这些参数会被动态设置；
                                    // CRS: _this.crs,
                                    // bbox: extent,
                                    // height: ol.extent.getHeight(extent),
                                    // width: ol.extent.getWidth(extent)
                                },
                                ratio: item['ratio']   //倍数
                            })
                            var layer = item['layer'];
                            if (layer && layer instanceof ol.layer.Image) {
                                layer.setSource(imageWMSSource);
                            }
                        }
                    })(i)
                }
            }
        }

        /**
         * 生成聚合图层
         * @param item
         */
        GenerateLayer.prototype.generateClusterLayer = function (item) {
            var id = item['infoId'];
            var _this = this;
            if (id && this.layerCluster && this.layerCluster[id]) {
                var elem = this.layerCluster[id];
                var type = elem['clusterType'];         //聚合图层类型
                var extent = this.caculateExtent(elem['extentRatio']);   //聚合请求所需的范围
                var workspace = this.findWorkspaceById(item['workspaceId']);
                var styleId = elem['styleId'];
                var layer = new ol.layer.Vector({
                    name: item['name'],
                    code: item['code'],
                    id: item['id'],
                    // extent: extent,
                    extentRatio: elem['extentRatio'],
                    clusterType: elem['clusterType'],
                    // source: (item['clusterType'] === "0") ? new ol.source.Cluster() : new ol.source.Vector(),
                    style: function (feature) {
                        var field = "info";
                        if (!feature.get('info')) {
                            var length = feature.get('features').length;
                            feature.set('info', length);
                        }
                        var styleFunc = _this.styleManager.generateStyle(styleId, field, feature);
                        if (typeof styleFunc === "function") {
                            var style = styleFunc(styleId, feature, field);
                            return style;
                        }
                        // var size = feature.get('info');
                        // var style = styleCache[size];
                        // if(!style){
                        //     style = new ol.style.Style({
                        //         image: new ol.style.Circle({
                        //             radius: 10,
                        //             stroke: new ol.style.Stroke({
                        //                 color: '#fff'
                        //             }),
                        //             fill: new ol.style.Fill({
                        //                 color: '#3399CC'
                        //             })
                        //         }),
                        //         text: new ol.style.Text({
                        //             text: size.toString(),
                        //             fill: new ol.style.Fill({
                        //                 color: '#fff'
                        //             })
                        //         })
                        //     });
                        //     styleCache[size]= style;
                        // }
                        // return style;
                    }
                })
                _this.layerArr.push(layer);
                var param = {
                    maxRes: item['maxRes'],
                    minRes: item['minRes'],
                    id: item['id'],
                    ratio: elem['extentRatio'],
                    observeExtent: elem['observeExtent'],  //地图范围变化是否重新计算
                    code: item['code'],
                    workspaceId: item['workspaceId'],
                    gridSize: elem['gridSize'],
                    extent: extent,
                    layer: layer,
                    workspace: workspace
                }
                //设置图层属性
                _this.setUniqueLayerProperties(item, layer);
                if (type == 0) {
                    //    前端
                    this.generateClusterSourceByOL(param);
                    //    获取数据源
                } else if (type == 1) {
                    //    后端
                    this.generateClusterByService(param);
                }
            }
        }
        /**
         * 根据地图视图像素大小来计算增量范围值
         * @param size
         * @param ratio
         * @returns {Array}
         */
        GenerateLayer.prototype.caculateDeltaXY = function (size, ratio) {
            var arr = [];
            if (size && size.length && this.res) {
                var deltaWidth = size[0] * (ratio - 1) * this.res;
                var deltaHeight = size[1] * (ratio - 1) * this.res;
                arr.push(deltaWidth, deltaHeight);
            }
            return arr;
        }
        /**
         * 计算范围
         * @param ratio
         * @param extent
         * @returns {*}
         */
        GenerateLayer.prototype.caculateExtent = function (ratio, extent) {
            var caculateExtent, resultExtent;
            if (extent && extent.length) {
                caculateExtent = extent;
            } else {
                if (this.mapExtent && this.mapExtent.length) {
                    caculateExtent = this.mapExtent;
                }
            }
            if (caculateExtent && caculateExtent.length) {
                if (ratio) {
                    var deltaX = ol.extent.getWidth(caculateExtent) * ( ratio - 1);
                    var deltaY = ol.extent.getHeight(caculateExtent) * (ratio - 1);

                    var minX = caculateExtent[0] - deltaX / 2;
                    var maxY = caculateExtent[3] + deltaY / 2;
                    var maxX = caculateExtent[2] + deltaX / 2;
                    var minY = caculateExtent[1] - deltaY / 2;
                    resultExtent = [minX, minY, maxX, maxY];
                } else {
                    resultExtent = caculateExtent;
                }
            }
            return resultExtent;
        }
        /**
         * 范围变化更新图层
         * @param param
         */
        GenerateLayer.prototype.updateLayerExtent = function (param) {
            //聚合图层有一部分超出范围一部分没超出范围，热力图也是，这个数据应该上层传；
            if (param['extent'] && param['extent'].length) {
                //这个用于标识前端地图范围变更时，恢复地图状态时使用
                var operateType = param['operateType'];
                var _this = this;
                switch (param['type']) {
                    //  前端聚合图更新
                    case "clusterOl" : {
                        this.updateSource(param['extent'], param['obj'], "clusterOl", operateType);
                        break;
                    }
                    //    更新后端聚合图层；
                    case "clusterRest" : {
                        // this.getClusterSource(param['obj']);
                        this.generateClusterSourceByService(param['obj'], operateType)
                        break;
                    }
                    // 前端热力图层更新
                    case "heatmapOl" : {
                        this.updateSource(param['extent'], param['obj'], "heatmapOl", operateType);
                        break;
                    }
                    case  "vector" : {
                        this.updateSource(param['extent'], param['obj'], "vector", operateType);
                        break;
                    }
                    case "heatmapRest": {
                        //热力图后端生成其实是wms图层接受url即可，这里加分支是为了，范围变革恢复状态计数使用；
                        if (operateType == "extentUpdate") {
                            _this.dispatchEvent({type: 'update-extent-source-success', param: param});
                            break;
                        }
                    }
                    default : {
                        break;
                    }
                }
            }
        }
        /**
         * 更新前端热力图与前端聚合图层
         * @param extent
         * @param obj
         * @param type
         * @param operateType
         */
        GenerateLayer.prototype.updateSource = function (extent, obj, type, operateType) {
            //operateType这个用于标识前端地图范围变更，获取数据源成功发送事件通知map使用
            if (this.sourceManager) {
                if (type == "clusterOl") {
                    // this.sourceManager.generateHeatmapSource(obj);
                    // this.updateClusterSource(obj)
                    this.sourceManager.getClusterSource(obj, operateType)
                } else if (type == "heatmapOl") {
                    // this.sourceManager.generateHeatmapSource(obj);
                    this.sourceManager.getClusterSource(obj, operateType);
                } else if (type == "vector") {
                    this.sourceManager.getVectorSource(obj, operateType);
                }
            }
        }

        /**
         * 前端聚合图层，数据源请求是先组织好所有的图层参数，最后一起发请求
         * @param param
         */
        GenerateLayer.prototype.generateClusterSourceByOL = function (param) {
            if (param && param['id'] && this.clusterSourceObj) {
                //    组织参数
                //判断分辨率是否可见
                var resFlag = this.compareRes(param['maxRes'], param['minRes'], this.res);
                if (resFlag) {
                    this.clusterSourceObj[param['id']] = param;
                }
                this.clusterSourceAllObj[param['id']] = param;

                var clusterSource = new ol.source.Cluster({
                    distance: param['gridSize'],
                    extent: param['extent'],         //前端聚合图层设置聚合范围
                    source: new ol.source.Vector()
                })
                //设置数据源；
                param['layer'].setSource(clusterSource);
            }
            // this.workspace['workspaceId'] = param['workspaceId'];   //这个不知道拿来干嘛用，先留着
            //将前端聚合请求数据源的参数放入一个对象当中，将对象放置一个数组当中；
        }
        /**
         * 前端聚合图层获取数据源
         * @param param
         * @param operateType
         */
        GenerateLayer.prototype.getClusterSource = function (param, operateType) {
            if (this.sourceManager) {
                this.sourceManager.getClusterSource(param, operateType);
            }
        }
        /**
         * 后端聚合图层，是一个个获取数据源，无需先组织参数
         * @param param
         */
        GenerateLayer.prototype.generateClusterByService = function (param) {
            //还需地图视图范围大小；
            var width, height;
            if (param && this.clusterObj) {
                if (param.extent && param.extent.length) {
                    width = ol.extent.getWidth(param.extent) / this.res;
                    height = ol.extent.getHeight(param.extent) / this.res;
                    // param['width'] = width;
                    param['width'] = this.size[0];
                    param['height'] = this.size[1];
                    // param['height'] = height;
                    param['distance'] = param['gridSize'];
                    var source = new ol.source.Vector();
                    param['layer'].setSource(source);
                    //组织参数
                    //判断分辨率
                    var resFlag = this.compareRes(param['maxRes'], param['minRes'], this.res);
                    if (resFlag) {
                        this.clusterObj[param['id']] = param;
                    }
                    this.clusterAllObj[param['id']] = param;
                }
            }
        }
        /**
         * 获取后端聚合图层图层
         * @param param
         * @param operateType
         */
        GenerateLayer.prototype.generateClusterSourceByService = function (param, operateType) {
            if (this.sourceManager) {
                this.sourceManager.generateClusterSourceByService(param, operateType);
            }
        }
        /**
         * 获取地图范围；
         * @param param
         */
        GenerateLayer.prototype.setMapViewOptions = function (param) {
            if (!this.isEmpty(param)) {
                this.mapExtent = param['extent'];
                this.size = param['size'];
                //    地图分辨率
                this.res = param['res'];
            }
            if (this.styleManager) {
                this.styleManager.setMapViewOptions(param);
            }
        }
        /**
         * 获取静态切片图层数据源
         * @param item
         * @param extent
         * @returns {ol.source.Zoomify}
         */
        GenerateLayer.prototype.getZoomifySource = function (item, extent) {
            // var id = item['id'];
            var url;
            var id = item['layerId'];
            var resourceType = item['resourceType'];

            //添加图片库地址；
            if (resourceType == "resource_zoomify") {
                var resourceZoomifyId = item['resourceId'];
                if (resourceZoomifyId && this.resourceZoomify) {
                    var elem = this.resourceZoomify[resourceZoomifyId];
                    if (elem) {
                        url = this.gisContext + elem['tilePath'] + "/{TileGroup}/{z}-{x}-{y}.png";
                    }
                }
            } else {
                //如果不是图片库中的静态切片图，检查替换上下文
                url = item['url'];
                if (this.styleManager && url) {
                    url = this.styleManager.changeUrlforContext(url)
                }
            }

            var size;
            if (this.layer) {
                var param = this.layer[id];
                //单一图层的时候layerId无值；
                if (!id && !param) {
                    for (var i in this.layer) {
                        param = this.layer[i];
                    }
                }
                if (param) {
                    // var extent = this.setImageExtent(param);
                    if (extent && extent.length) {
                        size = ol.extent.getSize(extent);
                    }
                }
            }
            var source = new ol.source.Zoomify({
                url: url || '',
                // url: item['url'] || '',
                size: size || [1024, 768]
                // crossOrigin:'Anonymous'
            })
            return source;
        }
        /**
         * 矢量数据源回到函数
         */
        GenerateLayer.prototype.vectorSourceCallBack = function () {
            var _this = this.domain;
            _this.sourceManager.getVectorSource(this.data);

        }
        /**
         * 生成瓦片图层
         * @param typeId
         * @param extent
         * @returns {ol.layer.Tile}
         */
        GenerateLayer.prototype.generateTileLayer = function (typeId, extent) {
            var item = this.layerTile[typeId];
            //瓦片类型
            var offRe = new RegExp('offline');
            var offline = offRe.test(item['type']);
            var type = item['type'] || 'custom';
            var options = item['options'] || "{}";

            var source = this.getTileSource(item, type, offline, options, extent);

            var layer = new ol.layer.Tile({
                source: source,
                useInterimTilesOnError: false  //无数据默认不使用上一级数据；
            })
            return layer;
        }
        /**
         * 生成静态图层
         * @param typeId
         * @param imageProperty
         * @param extent
         * @returns {*}
         */
        GenerateLayer.prototype.generateImageLayer = function (typeId, imageProperty, extent) {
            var item = this.layerImage[typeId];
            var url = item.url;
            //替换静态图的上下文
            if (url && this.styleManager) {
                url = this.styleManager.changeUrlforContext(url);
            }
            //添加图片库选择的路径
            if (item && item.hasOwnProperty('resourceType') && item.hasOwnProperty('resourceId')) {
                var resourceType = item['resourceType'];
                var resourceId = item['resourceId'];
                if (resourceType && resourceId && this.resourceZoomify && resourceType == "resource_zoomify") {
                    var elem = this.resourceZoomify[resourceId];
                    if (elem && elem.hasOwnProperty('path') && elem['path']) {
                        url = this.gisContext + elem['path'];
                    }
                }
            }
            var imageType = item.type;

            var options = item['options'] || '';
            var source = this.getImageSource(imageType, url, extent, options);
            var layer;
            if (imageProperty && imageProperty.hasOwnProperty('name')
                && imageProperty.hasOwnProperty('id') && imageProperty.hasOwnProperty('code')) {
                layer = new ol.layer.Image({
                    name: imageProperty['name'] || '',
                    id: imageProperty['id'] || '',
                    code: imageProperty['code'] || '',
                    source: source
                    //projection:this.layerProjection
                })
            } else {
                layer = new ol.layer.Image({
                    source: source
                    //projection:this.layerProjection
                })
            }
            return layer;
        }
        /**
         * 静态图层数据源
         * @param type
         * @param url
         * @param extent
         * @param options
         * @returns {*}
         */
        GenerateLayer.prototype.getImageSource = function (type, url, extent, options) {
            if (this.sourceManager) {
                var param = {type: type, url: url, extent: extent, options: options, projection: this.layerProjection}
                var source = this.sourceManager.getImageSource(param);
                return source;
            }
        }
        /**
         * 组织矢量图层的参数
         * @param typeId
         * @param item
         */
        GenerateLayer.prototype.orgnizeVectorParam = function (typeId, item) {
            // 根据id在layer_vector中查找样式id、数据源id；
            var layerInfo = this.layerVector[typeId];
            var options = layerInfo['options'];
            // 获取数据源
            var sourceId = layerInfo.sourceId; // 数据源ID
            // strict
            var strict = layerInfo['strict'];
            // if (this.sourceVector) {
            var ratio = layerInfo['extentRatio'];
            var extent = this.caculateExtent(ratio);


            // var item = this.sourceVector[sourceId];
            var item = this.sourceManager.getVectorSourceInfo(sourceId);
            if (JSON.stringify(item) != "{}") {
                var code = item.code;
                var workspaceId = item.workspaceId;
                var wsType = 1;
                // 组织图层参数结构;
                if (this.vecLayerObj) {
                    this.vecLayerObj.ratio = ratio;
                    this.vecLayerObj.maxRes = item['maxRes'];
                    this.vecLayerObj.minRes = item['minRes'];
                    this.vecLayerObj.extent = extent;
                    this.vecLayerObj.code = code;
                    this.vecLayerObj.workspaceId = workspaceId;
                    this.vecLayerObj.wsType = wsType;
                    this.vecLayerObj.options = options;
                    this.vecLayerObj.strict = strict;
                    this.vecLayerObj.id = layerInfo['id'];
                    this.vecLayerObj.observeExtent = layerInfo['observeExtent'];
                    this.layerObjArr.push(this.vecLayerObj);
                    //数组改成对象；
                    var resFlag = this.compareRes(item['maxRes'], item['minRes'], this.res);
                    if (resFlag) {
                        this.vectorObj[layerInfo['id']] = this.vecLayerObj;
                    }
                    //存放所有的
                    this.vectorAllObj[layerInfo['id']] = this.vecLayerObj;

                }
            }
        }
        /**
         * 判断地图当前视图分辨率是否落于特定最大小分辨率之间；
         * @param maxRes
         * @param minRes
         * @param res
         * @returns {boolean}
         */
        GenerateLayer.prototype.compareRes = function (maxRes, minRes, res) {
            if (!maxRes && !minRes) {
                return true;
            } else if (maxRes && minRes) {
                if (res && res >= minRes && res <= maxRes) {
                    return true;
                } else {
                    return false;
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
        /**
         * 生成
         * @param type
         * @param typeId
         * @param extent
         * @param imageProperty
         * @param item
         */
        GenerateLayer.prototype.getSingleLayer = function (type, typeId, extent, imageProperty, item) {
            if (type && typeId) {
                switch (type) {
                    case "layer_tile": {
                        if (this.layerTile) {
                            return this.generateTileLayer(typeId, extent);
                        }
                    }
                    case "layer_image": {
                        return this.generateImageLayer(typeId, imageProperty, extent)
                    }
                    case "layer_vector": {
                        if (this.layerVector) {
                            this.orgnizeVectorParam(typeId, item);
                        }
                        break;
                    }
                }
            }
        }
        /**
         * 创建图层组
         * @param item
         * @param layerGroupId
         */
        GenerateLayer.prototype.generateGroup = function (item, layerGroupId) {
            if (item && layerGroupId) {
                var attr = this.isNumber(item['opacity']);
                var group = new ol.layer.Group({
                    name: item.name,
                    code: item.code,
                    id: item.id,
                    // opacity: item.opacity || 1,
                    opacity: attr['flag'] ? attr['num'] : 1,
                    // visible: item.visible || true
                    visible: (typeof item['visible'] == "boolean") ? item['visible'] : true
                })
                // 存入图层组数组，给单独调用图层组时使用；
                this.layerGroupArr.push(group);
                // 加入地图
                // this.map.setLayerGroup(group);
                this.setExtent(item, group);
                this.setMaxRes(item, group);
                this.setMinRes(item, group);
                // 根据groupId在layer_group_rel中查找关联图层数组
                this.getLayerArray(layerGroupId, group);
            }
        }
        /**
         * 生成图层组
         */
        GenerateLayer.prototype.formateLayerGroup = function () {
            this.layerGroupArr = [];
            var mapLayer = this.mapLayerGroupRel;
            if (mapLayer && mapLayer.length) {
                for (var i = 0; i < mapLayer.length; i++) {
                    var layerGroupId = mapLayer[i];
                    if (this.layerGroup) {
                        var item = this.layerGroup[layerGroupId];
                        this.generateGroup(item, layerGroupId);
                    }
                }
            }
            //图层组数据获取完成；
            this.dispatchEvent({type: 'group-success', param: this.layerGroupArr});
        }
        /**
         * @param groupId
         * @param group
         */
        GenerateLayer.prototype.getLayerArray = function (groupId, group) {
            var imageFlag = false;
            if (this.layerGroupRel) {
                var layerArray = this.layerGroupRel[groupId];
                var layers = new ol.Collection();
                for (var i = 0; i < layerArray.length; i++) {
                    var layerId = layerArray[i];
                    var item = this.layer[layerId];
                    var type = item.type;
                    // 这个id别取错了
                    var id = item.infoId;

                    // 图层组过滤矢量图层
                    if (type != "layer_vector" && type != "layer_cluster" && type != "layer_heatmap") {
                        var layer;
                        // 判断是否有image图层；
                        if (type == "layer_image" && !imageFlag) {
                            var extent = this.setImageExtent(item);
                            if (!extent) {
                                extent = this.imageExtent;
                            }
                            imageFlag = true;
                            layer = this.getSingleLayer(type, id, extent);
                        } else {
                            //瓦片图层
                            var subType, extent;
                            if (type == 'layer_tile') {
                                subType = this.layerTile[id]['type'];
                            }
                            if (subType == "layer_zoomify") {
                                extent = this.setImageExtent(item);
                            }
                            layer = this.getSingleLayer(type, id, extent, item);
                        }
                        if (layer) {
                            layers.insertAt(i, layer);
                        }
                    }
                }
                group.setLayers(layers);
            }
        }

        /**
         * 设置图片图层范围大小值；
         * @param item
         * @returns {Array}
         */
        GenerateLayer.prototype.setImageExtent = function (item) {
            var extent = [];
            var left = this.isNumber(item['extentLeft']);
            var right = this.isNumber(item['extentRight']);
            var top = this.isNumber(item['extentTop']);
            var bottom = this.isNumber(item['extentBottom']);
            if (left && left.flag && right && right.flag && top && top.flag && bottom && bottom.flag) {
                extent.push(left.num);
                extent.push(bottom.num);
                extent.push(right.num);
                extent.push(top.num);
            }
            else {
                extent = [-0.5, -767.5, 1023.5, 0.5];
            }
            //范围值改变，发出事件让map调整范围与中心点；
            this.dispatchEvent({type: 'image-extent-change', param: extent})

            // this.map.getView().setCenter(ol.extent.getCenter(extent));
            return extent;
        }
        /**
         * 判断是否为数字；
         * @param num
         * @returns {*}
         */
        GenerateLayer.prototype.isNumber = function (num) {
            if (parseFloat(num).toString() === "NaN") {
                return '';
            } else {
                var obj = {};
                obj['num'] = Number(parseFloat(num).toString());
                obj['flag'] = true;
                return obj;
            }
        }
        /**
         * 设置最小分辨率
         * @param params
         * @param layer
         */
        GenerateLayer.prototype.setMinRes = function (params, layer) {
            // if (params.minRes) {
            var minRes = this.isNumber(params['minRes']);
            if (minRes.flag) {
                layer.setMinResolution(minRes.num);
            }
        }
        /**
         * 设置最大分辨率
         * @param params
         * @param layer
         */
        GenerateLayer.prototype.setMaxRes = function (params, layer) {
            // if (params.maxRes) {
            var maxRes = this.isNumber(params['maxRes']);
            if (maxRes.flag) {
                layer.setMaxResolution(maxRes.num);
            }

        }
        /**
         * 设置范围
         * @param params
         * @param layer
         */
        GenerateLayer.prototype.setExtent = function (params, layer) {
            var extent = this.setLayerExtent(params);
            if (extent) {
                layer.setExtent(extent)
            }
        }
        /**
         * 设置透明度
         * @param params
         * @param layer
         */
        GenerateLayer.prototype.setOpacity = function (params, layer) {
            if (params.hasOwnProperty('opacity')) {
                layer.setOpacity(params.opacity);
            }
        }
        /**
         * 设置显隐性
         * @param params
         * @param layer
         */
        GenerateLayer.prototype.setVisible = function (params, layer) {
            if (params.hasOwnProperty('visible')) {
                layer.setVisible(params.visible);
            }
        }
        /**
         * 根据工作空间id查找工作空间
         * @param workspaceId
         */
        GenerateLayer.prototype.findWorkspaceById = function (workspaceId) {
            if (this.workspace && workspaceId) {
                for (var i in this.workspace) {
                    if (i == workspaceId) {
                        var workspace = this.workspace[i].code;
                        return workspace;
                    }
                }
            }
        }
        /**
         * 设置范围
         * @param item
         * @returns {Array}
         */
        GenerateLayer.prototype.setLayerExtent = function (item) {
            var extent = [];
            var left = this.isNumber(item['extentLeft']);
            var right = this.isNumber(item['extentRight']);
            var top = this.isNumber(item['extentTop']);
            var bottom = this.isNumber(item['extentBottom']);
            if (left && left.flag && right && right.flag && top && top.flag && bottom && bottom.flag) {
                extent.push(left.num);
                extent.push(bottom.num);
                extent.push(right.num);
                extent.push(top.num);
            }
            else {
                extent = undefined;
            }
            return extent;
        }
        /**
         * 生成矢量图层；
         * @param item
         */
        GenerateLayer.prototype.generateVecLayer = function (item) {
            var typeId = item['infoId'];
            var _this = this;
            // 是否屏蔽矢量要素图层
            if (!this.noVecLayers) {
                // 先生成样式；
                if (this.layerVector) {
                    (function (typeId, item) {
                        // var typeId = item['infoId'];
                        var styleDef = _this.layerVector[typeId];
                        //图层id值
                        var layerId = styleDef['layerId'];
                        //获取字段样式的字段；
                        var categoryField = styleDef ? styleDef['categoryField'] : null;
                        // 定义矢量图层
                        var workspace = _this.findWorkspaceById(item['workspaceId']);
                        var workspaceId = item['workspaceId']
                        // (function (styleId, field) {
                        //默认样式id值；
                        var styleId = styleDef['styleId'];

                        var field = styleDef['annoField'];
                        var vecLayer = new ol.layer.Vector({
                            name: item['name'],
                            id: item['id'],
                            code: item['code'],
                            workspace: workspace,
                            source: new ol.source.Vector(),
                            // style: style
                            style: function (feature) {
                                // var fid = feature.get('fid');
                                // var featureId = feature.id_;
                                var featureId = feature.get('fid');
                                // var key = _this.manageAnimate(feature, item['code'], workspace || workspaceId);

                                //feature 用fid 标识 ，有fid才能进行动画的绑定；
                                var styles, targetStyleId;

                                var categoryStyleId
                                var id = feature.get('id');
                                //判断是否字段样式中的字段是否配置
                                if (categoryField) {
                                    //此要素，该字段的值
                                    var categoryValue = feature.get(categoryField);
                                    categoryStyleId = _this.getStyleIdByAttribute(categoryValue, layerId);
                                }
                                if (categoryStyleId) {
                                    targetStyleId = categoryStyleId;
                                } else {
                                    targetStyleId = styleId;
                                }
                                var style = _this.styleManager.generateStyle(targetStyleId, field, feature);
                                if (style && typeof style === "function") {
                                    // return style(styleId, feature, field);
                                    styles = style(targetStyleId, feature, field);
                                }

                                //如果fid 没有值，那么无法绑定动画
                                var geomType = feature.getGeometry();
                                if (featureId && geomType && geomType instanceof ol.geom.Point) {
                                    // var str = featureId + '-' + item['code'] + '-' + workspace;
                                    _this.detectAnimate(feature, item['code'], workspace || workspaceId, targetStyleId, styles);
                                }
                                return styles;
                            }
                        })
                        // 这里加入全局变量；
                        _this.layerArr.push(vecLayer);
                        // _this.layersObj[item['code'] + "_" + workspace] = vecLayer;

                        /**
                         * 存放矢量图层，排除第三方数据源矢量图层，用于获取数据源
                         * 第三方数据源矢量图层，也算非异步图层
                         */
                        if (item['type'] == "layer_vector") {
                            _this.refreshVecLayerObj(vecLayer, workspace);
                        } else if (item['type'] == "layer_vector_custom") {
                            _this.syncLayerNum++;
                        }

                        // layer = vecLayer;
                        _this.setUniqueLayerProperties(item, vecLayer);
                        _this.getSingleLayer(item['type'], typeId, null, null, item);
                        // return vecLayer;
                    })(typeId, item)
                }
            }
        }
        /**
         * 重新组织一下参数
         * @param param
         */
        GenerateLayer.prototype.reorgnizeStatusParams = function (param) {
            if (param && param['param']) {
                var items = param['param'];
                var styleId = items['styleId']
                var feature = items['feature'];
                var fid = feature.get('fid');
                var code = items['layerCode'];
                var workspace = items['workspace'];
                var styles = items['styles'];
                // var key = this.manageAnimate(feature, code, workspace);
                if (fid) {
                    var str = fid + '-' + code + '-' + workspace;
                    // if(!_this.animateObj[str]){
                    this.detectAnimate(feature, code, workspace, null, styles, styleId);
                    // }
                }

            }

        }
        /**
         * 管理与配置动画效果
         * @param feature
         * @param layerCode
         * @param workspace
         * @returns {string}
         */
        GenerateLayer.prototype.manageAnimate = function (feature, layerCode, workspace) {
            if (feature instanceof ol.Feature) {
                var fid = feature.get('fid');
                if (fid && layerCode && workspace) {
                    var key = fid + "-" + layerCode + "-" + workspace;
                    if (!this.animateObj[key]) {
                        var time = new Date().getTime();
                        var obj = {
                            fid: fid,
                            feature: feature,
                            startTime: time,
                            baseTime: time,
                            flushFlag: true,
                            key: key
                        }
                        this.animateObj[key] = obj;
                        return key;
                        // return obj;
                    }
                }
            }
        }
        /**
         *  更新动画记录对象，记录事件key
         * @param param
         * @param eventKey
         */
        GenerateLayer.prototype.addMapEventKey = function (param, eventKey) {
            if (param && param['param'] && param['param'].hasOwnProperty('paramKey') && eventKey) {
                var key = param['param']['paramKey'];
                this.animateObj[key]['mapEventKey'] = eventKey;

            }

        }
        /**
         * 删除动画
         * @param key
         */
        GenerateLayer.prototype.removeAnimate = function (key) {
            if (key && this.animateObj[key]) {
                delete  this.animateObj[key];
            }
        }
        /**
         * 更新动画对象参数；
         * @param param
         */
        GenerateLayer.prototype.updateAnimateParam = function (param) {
            if (param && param['key']) {
                var key = param['key'];
                if (this.animateObj[key]) {
                    this.animateObj[key] = param;
                }
            }
        }
        /**
         * 根据要素属性值找对应的样式id；
         * @param categoryValue
         * @param layerId
         * @returns {*}
         */
        GenerateLayer.prototype.getStyleIdByAttribute = function (categoryValue, layerId) {
            if (this.styleCategory && this.styleCategory.hasOwnProperty(layerId)) {
                var categoryParam = this.styleCategory[layerId];
                for (var i in categoryParam) {
                    var item = categoryParam[i];
                    if (i == categoryValue) {
                        return item['styleConfId'];
                    }
                }
            }
        }
        /**
         * 判断要素是否有动画
         * @param feature
         * @param code
         * @param workspace
         * @param styleId
         * @param style
         * @param animId
         */
        GenerateLayer.prototype.detectAnimate = function (feature, code, workspace, styleId, style, animId) {
            var animateId;
            if (animId) {
                animateId = animId;
            } else if (this.styleConf && this.styleConf[styleId] && this.styleConf[styleId]['animId']) {
                animateId = this.styleConf[styleId]['animId']
            }
            if (animateId) {
                var key = this.manageAnimate(feature, code, workspace);
                this.dispatchEvent({
                    type: 'generate-animate-request',
                    param: {paramKey: key, param: this.animateObj, styleId: animateId, style: style}
                })
            }
            // var obj = this.animateObj[featureId]
            return;
            if (this.styleConf && this.styleConf[styleId] && this.styleConf[styleId]['animId']) {
                var animateId = this.styleConf[styleId]['animId'];
                var key = this.manageAnimate(feature, code, workspace);
                // var obj = this.animateObj[featureId]

                this.dispatchEvent({
                    type: 'generate-animate-request',
                    param: {paramKey: key, param: this.animateObj, styleId: animateId, style: style}
                })
            }
        }
        /**
         * 向外提供生成样式接口
         * @param styleId
         * @param field
         * @param feature
         * @returns {*}
         */
        GenerateLayer.prototype.generateStyle = function (styleId, field, feature) {
            if (this.styleManager) {
                return this.styleManager.generateStyle(styleId, field, feature);
            }
        }
        /**
         * 外部接口，提供单一图层调用
         * @returns {Array}
         */
        GenerateLayer.prototype.generateSingleLayer = function () {
            if (this.layer) {
                this.layerArr = [];
                for (var i in this.layer) {
                    this.singleLayerNum++;
                    var item = this.layer[i];
                    this.vecLayerObj = {};
                    //聚合图层
                    this.clusterObj = {};
                    //热力图层
                    this.heatmapObj = {};
                    if (item['type'] && item['infoId']) {
                        if (item['type'] == 'layer_vector') {
                            this.generateVecLayer(item);
                        } else if (item['type'] == "layer_cluster") {
                            this.generateClusterLayer(item);
                        } else if (item['type'] == "layer_heatmap") {
                            this.generateHeatmap(item);
                        } else {
                            this.generateOtherLayer(item);
                        }
                    }
                }
                //判断是否只有非异步图层；
                if (this.singleLayerNum == this.syncLayerNum) {
                    this.singleLayerFlag = true;
                    this.singleLayerSuccess();
                }
//					请求矢量数据源之前抛出事件；
                this.dispatchEvent({
                    type: 'orgnize-vector-param-success', param: {
                        data: this.layerObjArr,
                        func: this.vectorSourceCallBack,
                        domain: this
                    }
                })
                if (!this.evt) {
                    // 已经全部获取与组织好图层实例的所有数据源结构 ----矢量图层
                    this.sourceManager.getVectorSource(this.layerObjArr);
                }
                //    发请求获取后端热力图
                this.generateHeatmapByService(this.heatmapObj);
                //    发请求获取前端热力图数据源
                this.generateHeatmapSource(this.olHeatmapObj);

                //    发请求获取前端聚合图层数据源
                this.getClusterSource(this.clusterSourceObj);

                //  发请求获取后端聚合图层
                this.generateClusterSourceByService(this.clusterObj);
                //将所有动态的要素放入一个对象当中
                this.updateChangeObj();

                //抛事件，让地图监听
                this.singleLayerFlag = true;
                // this.singleLayerSuccess();
                //
                return this.layerArr;

            }
        }
        /**
         * 提供给外部接口调用的图层组接口；
         */
        GenerateLayer.prototype.generateLayerGroup = function () {
            this.layerGroupArr = [];
            if (this.layerGroup) {
                for (var i in this.layerGroup) {
                    var item = this.layerGroup[i];
                    this.generateGroup(item, i);
                }
                //图层组数据获取完成；
                this.dispatchEvent({type: 'group-success', param: this.layerGroupArr});
            }
        }
        /**
         * 设置地图投影
         * @param projection
         */
        GenerateLayer.prototype.setMapProjection = function (projection) {
            if (projection) {
                this.projection = projection;
            }
        }
        /**
         * arcgis离线瓦片地图数据源生成
         * @param item
         * @param options
         * @param type
         * @returns {ol.source.XYZ}
         */
        GenerateLayer.prototype.generateArgOffSource = function (item, options, type) {
            var url;
            var source = new ol.source.XYZ({
                tileUrlFunction: function (tileCoord) {
                    var x, y;
                    var oo = "00000000";
                    var zz = tileCoord[0];
                    var z = "L" + zz;
                    var xx = tileCoord[1].toString(16);
                    var yy = (-tileCoord[2] - 1).toString(16); //注意此处，计算方式变了
                    if (type == "arcgis_offline_dec") {
                        //十进制
                        x = tileCoord[1];
                        y = -tileCoord[2] - 1;
                        z = zz;
                        url = item.url + '/' + z + '/' + x + '/' + y + '.png';
                    } else {
                        if (options) {
                            var tileOptions = {lowercase: false};
                            try {
                                tileOptions = JSON.parse(options);
                            } catch (e) {
                            }
                            if (tileOptions.lowercase) {
                                x = "C" + (oo.substring(0, 8 - xx.length) + xx);
                                y = "R" + (oo.substring(0, 8 - yy.length) + yy);
                            } else {
                                x = "C" + (oo.substring(0, 8 - xx.length) + xx).toUpperCase();
                                y = "R" + (oo.substring(0, 8 - yy.length) + yy).toUpperCase();
                            }
                        } else {
                            x = "C" + (oo.substring(0, 8 - xx.length) + xx).toUpperCase();
                            y = "R" + (oo.substring(0, 8 - yy.length) + yy).toUpperCase();
                        }
                        url = item.url + '/' + z + '/' + y + '/' + x + '.png'
                    }
                    // var url = item.url + '/' + z + '/' + x + '/' + y + '.png'
                    return url;
                },
                projection: this.projection || 'EPSG:3857'
            })
            return source;
        }
        /**
         * 其他瓦片数据源
         * @param item
         * @returns {ol.source.XYZ}
         */
        GenerateLayer.prototype.generateOtherOffTileSource = function (item) {
            var source = new ol.source.XYZ({
                tileUrlFunction: function (tileCoord) {
                    var z = tileCoord[0];
                    var x = tileCoord[1];
                    var y = -tileCoord[2] - 1;
                    return item.url + z + '/' + x + '/' + y + '.png'
                }
            })
            return source;
        }
        /**
         * 在线瓦片数据源
         * @param type
         * @returns {*}
         */
        GenerateLayer.prototype.generateOnLineTileSource = function (type) {
            switch (type) {
                case 'google_vec': {
                    return 'http://mt2.google.cn/vt/lyrs=y&hl=zh-CN&gl=CN&src=app&x={x}&y={y}&z={z}&s=G';
                }
                case 'google': {
                    return 'http://mt2.google.cn/vt/lyrs=y&hl=zh-CN&gl=CN&src=app&x={x}&y={y}&z={z}&s=G';
                }
                case 'gaode': {
                    return 'http://webrd03.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=8'// 高德地图在线
                }
                case 'google_sat': {
                    // 影像图无标注
                    return 'http://mt1.google.cn/maps/vt?lyrs=s%40726&hl=zh-Hans-CN&gl=CN&x={x}&y={y}&z={z}';
                }
                case 'gaode_vec': {
                    // 高德矢量图与标注图混合地图地址
                    return 'http://webrd02.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
                }
                case 'gaode_sat': {
                    // 高德影像图无标注
                    return 'http://webst03.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
                }
                default: {
                    return null;
                }
            }
        }
        /**
         * wmstile类型瓦片
         * @param item
         * @param options
         * @returns {ol.source.TileWMS}
         */
        GenerateLayer.prototype.generateWmsTileOnlineSource = function (item, options) {
            var params;
            if (options) {
                options = JSON.parse(options);
                if (options.hasOwnProperty('tileGrid')) {
                    var tileGrid = new ol.tilegrid.TileGrid(options['tileGrid']);
                    options['tileGrid'] = tileGrid;
                }
                options.url = item.url;
                params = options;
            } else {
                params = {
                    url: item.url
                }
            }
            var source = new ol.source.TileWMS(params);
            return source;
        }
        /**
         * 生成自定义瓦片图层数据源
         * @param item
         */
        GenerateLayer.prototype.customTileLayerSource = function (item) {
            if (item && item.extent && item.tileSize && item.origin) {
                var width;
                if (this.projection) {
                    width = this.projection.getExtent();
                }
                if (width && !item.resolutions) {
                    var startResolution = width / item.tileSize;
                    var resolutions = new Array(18);
                    for (var i = 0; i < resolutions.length; i++) {
                        resolutions[i] = startResolution / Math.pow(2, i);
                    }
                    var origin;
                    switch (item.origin) {
                        case "topLeft":
                            origin = ol.extent.getTopLeft(item.extent);
                            break;
                        case "bottomLeft":
                            origin = ol.extent.getBottomLeft(item.extent);
                            break;
                        case "bottomRight":
                            origin = ol.extent.getBottomRight(item.extent);
                            break;
                        case "topRight":
                            origin = ol.extent.getTopRight(item.extent);
                            break;
                        default:
                            origin = ol.extent.getTopLeft(item.extent);
                            break;
                    }
                    var tileGrid = new ol.tilegrid.TileGrid({
                        origin: origin,
                        resolutions: resolutions,
                        tileSize: item.tileSize || 256
                    })
                    var source = new ol.source.TileImage({
                        tileUrlFunction: function (tileCoord, pixelRatio, projection) {
                            var z = tileCoord[0];
                            var x = tileCoord[1];
                            var y = -tileCoord[2] - 1;
                            var path = item.url + "/+" + z + "/" + y + "/" + x + ".png";
                            return path;
                        },
                        projection: this.layerProjection,
                        tileGrid: tileGrid
                    })
                    return source;
                }
            }
        }
        /**
         * 获取图层的坐标信息
         * @param param
         */
        GenerateLayer.prototype.getProjInfo = function (param) {
            var _this = this;
            Ajax.ajax({
                method: 'GET',
                url: _this.gisContext + "web/crsInfo/query",
                data: {},
                success: function (data) {
                    if (data && data.errorCode == "0" && data.data) {
                        var proj = data.data;
                        if (param && typeof param['callback'] == "function") {
                            var callback = param['callback'];
                            callback(param, proj);
                        }
                    }
                }
            })

        }
        /**
         * 初始化瓦片图层加载函数的方法
         */
        GenerateLayer.prototype.initLoadFunc = function () {

            var xyzFunc = function (tileCoord, url, type) {
                var z = tileCoord[0];
                var x = tileCoord[1];
                var y = -tileCoord[2] - 1;
                return url + z + '/' + x + '/' + y + '.' + type;
            }
            this.tileLoadFunc['XYZ'] = xyzFunc;
            var tmsFunc = function (tileCoord, url, type) {
                var z = tileCoord[0];
                var x = tileCoord[1];
                // var y = -tileCoord[2] - 1; //tms 谷歌tms瓦片的加载
                var y = Math.pow(2, z) + tileCoord[2] - 1;   //标准tms加载
                return url + z + '/' + x + '/' + y + '.' + type;
            }
            this.tileLoadFunc['TMS'] = tmsFunc;
            var agc10Func = function (tileCoord, url, type, options, _this) {
                return _this.argTileFunc(tileCoord, url, "arcgis_offline_dec", options, type);
            }
            this.tileLoadFunc['ArcGIS10'] = agc10Func;
            var agc16Func = function (tileCoord, url, type, options, _this) {
                return _this.argTileFunc(tileCoord, url, "arcgis_offline_ hex", options, type);
            }
            this.tileLoadFunc['ArcGIS16'] = agc16Func;

        }
        /**
         * 扩展通用瓦片图层加载方案
         * @param key
         * @param funcString  回调函数
         */
        GenerateLayer.prototype.addLoadFunc = function (key, funcString) {
            if (funcString) {
                this.tileLoadFunc[key] = funcString;
            }
        }
        /**
         * 生成瓦片图层数据源
         * @param url
         * @param loadFunc
         * @param tileGrid
         * @param type
         * @param projection
         * @returns {*}
         */
        GenerateLayer.prototype.getTileFunc = function (url, loadFunc, tileGrid, type, projection, options) {
            var source;
            if (this.tileLoadFunc && loadFunc && this.tileLoadFunc[loadFunc]) {
                var func = this.tileLoadFunc[loadFunc];
                var _this = this;
                if (func && typeof func == "function") {
                    // var func = new Function('return ' + funcString)();
                    // (function (url, type, options, _this, tileGrid, projection) {
                    source = new ol.source.XYZ({
                        tileGrid: tileGrid,
                        projection: projection || _this.projection,
                        tileUrlFunction: function (tileCoord) {
                            return func(tileCoord, url, type, options, _this)
                        }
                    })
                    return source;
                    // })(url, type, options, _this, tileGrid, projection)

                }
            }

        }
        /**
         * 生成通用瓦片图层数据源
         * @param item
         */
        GenerateLayer.prototype.generateGeneralTileSource = function (item) {
            var resolution = [], url, options, origin = [];

            if (item && item['loadFunction']) {
                var loadFunc = item['loadFunction'];

                if (item['levelResolution'] && item['levelResolution']['value']) {
                    // resolution = JSON.parse(item['levelResolution'].value);
                    var arr = JSON.parse(item['levelResolution'].value);
                    if (arr && arr.length) {
                        for (var i = 0; i < arr.length; i++) {
                            var elem = arr[i];
                            if (elem && elem.resolution) {
                                var res = Number(elem.resolution);
                                resolution.push(res);
                            }
                        }
                    }
                }
                if (item.origin) {
                    var arr = item.origin.split(",");
                    if (arr && arr.length == 2) {
                        for (var i = 0; i < arr.length; i++) {
                            origin.push(Number(arr[i]));
                        }
                    }
                }

                var tileGrid = new ol.tilegrid.TileGrid({
                    // origin: item['origin'].split(","),
                    // origin:ol.extent.getTopLeft(this.projection.getExtent()),
                    origin: origin,
                    resolutions: resolution,
                    tileSize: [256, 256]
                })
                var type = item['format'] ? item['format'].toLowerCase() : "png";
                var layerProjection;

                /**
                 * 替换一下通用瓦片图层的上下文
                 */
                if (item['url'] && this.styleManager) {
                    url = item['url'];
                    this.styleManager.changeUrlforContext(url)
                }
                if (item['options']) {
                    options = item['options']
                }

                if (item['crs']) {
                    // var mapProjCode = this.projection.get('code');
                    var mapProjCode = this.projection.getCode();
                    var extent = this.projection.getExtent();
                    console.log(extent)
                    if (this.projection && item['crs'] == mapProjCode) {
                        layerProjection = this.projection;
                        var source = this.getTileFunc(url, loadFunc, tileGrid, type, layerProjection, options);
                        return source;
                    } else {
                        layerProjection = ol.proj.get(item['crs']);
                        if (!layerProjection) {
                            this.getProjInfo({
                                callback: this.generateReprojectSource,
                                param: {
                                    url: url,
                                    loadFunc: loadFunc,
                                    tileGrid: tileGrid,
                                    type: type,
                                    crs: item['crs'],
                                    options: options
                                }
                            })
                        } else {
                            layerProjection = this.projection;
                            return this.getTileFunc(url, loadFunc, tileGrid, type, layerProjection, options);
                        }
                    }

                }
            }
        }
        /**
         * 除了EPSG4326、 EPSG:3857以及地图坐标系以外的其他坐标生成数据源
         * @param param
         * @param proj
         */
        GenerateLayer.prototype.generateReprojectSource = function (param, proj) {
            if (proj && param && param['crs']) {
                proj4.defs(param['crs'], proj);
                var layerProjection = ol.proj.get(item['crs']);
                this.getTileFunc(param['url'], param['loadFunc'], param['tileGrid'], param['type'], layerProjection);
            }
        }

        /**
         * arcgis切片数据的加载
         * @param tileCoord
         * @param item     layertile对象
         * @param type      区分10进制与16进制
         * @param options   16进制图片行列号字母的大小写类型
         * @param format    图片的格式
         * @returns {string|*}
         */
        GenerateLayer.prototype.argTileFunc = function (tileCoord, url, type, options, format) {
            //region
            var picType = format ? format.toLowerCase() : "png";
            var x, y;
            var oo = "00000000";
            var zz = tileCoord[0];
            var z = "L" + zz;
            if (zz.toString().length < 2) {
                z = "L0" + zz;
            }
            var xx = tileCoord[1].toString(16);
            var yy = (-tileCoord[2] - 1).toString(16); //注意此处，计算方式变了
            //endregion
            if (type == "arcgis_offline_dec") {
                //十进制
                x = tileCoord[1];
                y = -tileCoord[2] - 1;
                z = zz;
                url = url + '/' + z + '/' + x + '/' + y + '.' + picType;
            } else {
                if (options) {
                    var tileOptions = {lowercase: false};
                    try {
                        tileOptions = JSON.parse(options);
                    } catch (e) {
                    }
                    if (tileOptions.lowercase) {
                        x = "C" + (oo.substring(0, 8 - xx.length) + xx);
                        y = "R" + (oo.substring(0, 8 - yy.length) + yy);
                    } else {
                        x = "C" + (oo.substring(0, 8 - xx.length) + xx).toUpperCase();
                        y = "R" + (oo.substring(0, 8 - yy.length) + yy).toUpperCase();
                    }
                } else {
                    // x = "C" + (oo.substring(0, 8 - xx.length) + xx).toUpperCase();
                    x = "C" + (oo.substring(0, 8 - xx.length) + xx);
                    // y = "R" + (oo.substring(0, 8 - yy.length) + yy).toUpperCase();
                    y = "R" + (oo.substring(0, 8 - yy.length) + yy);
                }
                url = url + '/' + z + '/' + y + '/' + x + '.' + picType;
            }
            return url;
        }

        /**
         * 瓦片数据源
         * @param item
         * @param type
         * @param offline
         * @param options
         * @param extent
         * @returns {*}
         */
        GenerateLayer.prototype.getTileSource = function (item, type, offline, options, extent) {
            var source = null
            //静态切片图层；
            if (type == "layer_zoomify") {
                source = this.getZoomifySource(item, extent);
                return source;
            }
            //自定义类型；
            if (type == "custom") {
                var url = item['url'] || '';
                //自定义类型的瓦片图替换上下文
                if (url && this.styleManager) {
                    url = this.styleManager.changeUrlforContext(url);
                }
                var source = new ol.source.XYZ({
                    url: url
                })
                return source;
            }

            //通用瓦片图层
            if (type == "general") {
                var source = this.generateGeneralTileSource(item);
                return source;
            }

            // 离线
            if (offline) {
                var type = item['type'];
                if (item.url) {
                    if (this.styleManager) {
                        // 离线替换url上下文
                        item.url = this.styleManager.changeUrlforContext(item.url);
                    }
                    if (type == 'arcgis_offline' || type == "arcgis_offline_dec") {
                        source = this.generateArgOffSource(item, options, type);
                    } else {
                        source = this.generateOtherOffTileSource(item)
                    }
                }
            } else {
                // 在线 判断类型
                if (!item.url || $.trim(item.url).length < 1) {
                    var type = item['type'];
                    if (type) {
                        var url = this.generateOnLineTileSource(type);
                        if (url) {
                            item['url'] = url;
                        }
                    } else {
                        return;
                    }
                }
                switch (type) {
                    case 'wms_tile':
                        source = this.generateWmsTileOnlineSource(item, options)
                    default:
                        var params = {url: item.url};
                        source = new ol.source.XYZ(params);
                        break;
                }
            }
            // this.estimateLayerFinish();
            return source;
        }

        /**
         * 根据图层编码以及工作空间查找图层
         * @param code
         * @param workspace
         * @returns {*}
         */
        GenerateLayer.prototype.findLayerByCodeAndWorkspace = function (code, workspace) {
            if (this.layerArr && this.layerArr) {
                for (var i = 0; i < this.layerArr.length; i++) {
                    var item = this.layerArr[i];
                    var itemCode = item.get('code');
                    var itemWorkspace = item.get('workspace');
                    if (itemCode == code && workspace == itemWorkspace) {
                        return item;
                    }
                }
            }
        }
        /**
         * 根据后端获取数据恢复状态
         * @param data
         */
        GenerateLayer.prototype.updateStatus = function (data) {
            if (this.styleManager) {
                this.styleManager.updateStatus(data);
            }
        }
        /**
         * 更新图层样式
         * @param param
         */
        GenerateLayer.prototype.updateStyle = function (param) {
            if (this.styleManager) {
                this.styleManager.updateStyle(param);
            }
        }

        /**
         * 地图范围变更，前端恢复地图要素状态
         */
        GenerateLayer.prototype.recoveryFeatureByObj = function () {
            if (this.styleManager) {
                this.styleManager.recoveryFeatureByObj();
            }
        }
        /**
         * 向第三方数据源的矢量图层添加数据
         * @param code   图层编码
         * @param wsCode    图层所在工作空间的编码
         * @param geoJson    要素
         */
        GenerateLayer.prototype.addFeatureToNoneResourceLayer = function (code, wsCode, geoJson) {
            if (this.layerArr && code && wsCode && geoJson) {
                var layer = this.findLayerByCodeAndWorkspace(code, wsCode);
                if (layer && layer instanceof ol.layer.Vector) {
                    var source = layer.getSource();
                    var parse = new ol.format.GeoJSON();
                    var features = parse.readFeatures(geoJson);
                    if (features && features.length) {
                        source.addFeatures(features);
                    }
                }
            }
        }
        // 获取styleid
        GenerateLayer.prototype.getStyleId=function (code,wsCode) {
          var styleId = null;
          var field = null;
          var layer = this.findLayerByCodeAndWorkspace(code, wsCode);
          if (layer) {
            var id = layer.get('id');
            if (this.layer && id) {
              var item = this.layer[id];
              if (item) {
                var infoId = item['infoId'];
                if (this.layerVector) {
                  var elem = this.layerVector[infoId];
                  if (elem) {
                    styleId = elem['styleId'];
                    field = elem['annoField'];
                  }
                }
              }
            }
          }
          return {
            styleId:styleId,
            field:field
          }
        } 

    //     return GenerateLayer;
    // })
    export default GenerateLayer
