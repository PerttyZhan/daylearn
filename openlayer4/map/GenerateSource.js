/**
 * Created by tangwenjing on 2017/10/9.
 */
// define('gais/map/GenerateSource', ['ol',  'gais/map/Ajax'], function (ol, Ajax) {
    import ol from './ol'
    import Ajax from './Ajax'
    var GenerateSource = function (opts) {
        ol.Object.call(this);
        this.json = opts.json || {};
        this.engineUrl = opts.engineUrl || '';
        this.gisContext = opts.gisContext || '';
        this.clusterSourceUrl = opts.clusterSourceUrl || '';
		this.featureDataUrl = opts.featureDataUrl|| '';   //获取数据源透传接口
    };
    ol.inherits(GenerateSource, ol.Object)
    GenerateSource.prototype.init = function () {
        this.sourceVector = this.json['source_vector'];
        this.mapInfo = this.json['map'];
        this.workspace = this.json['workspace'];
        // this.vecLength = 0;
        // this.vecLayerNum = 0;
        // this.vectorResponseCount = 0;
        this.layerTotal = 0;
        this.featureLoadFinishFlag = false;
    };
    GenerateSource.prototype.setMapCodeAndWorkspace = function () {
        var mapCodeAndWork = {};
        if (this.mapInfo && this.workspace) {
            mapCodeAndWork.code = this.mapInfo['code'];
            var workspaceId = this.mapInfo['workspaceId'];
            if (workspaceId) {
                var item = this.workspace[workspaceId];
                mapCodeAndWork.workspace = item.code;
            }
        }
        return mapCodeAndWork;
    }
    GenerateSource.prototype.generateBBOX = function (obj) {
        if (obj && obj['extent'] && obj.observeExtent) {
            var bbox = "BBOX(geom," + obj.extent.toString() + ")";
            return bbox;
        }
    }
    GenerateSource.prototype.generateOptions = function (obj, mapObj) {
        var data = {
            wsType: (obj && obj.wsType) ? obj.wsType : undefined
        };

        var bbox = this.generateBBOX(obj)

        var strict = (obj && obj['strict']) ? obj.strict : false;
        if (strict) {//严格模式
            var options;
            if (obj['options']) {//有选项参数

                try {
                    options = JSON.parse(obj['options']);
                } catch (e) {
                    options = {cql: ''};
                }
                if (mapObj.code && mapObj.workspace) {
                    if (options['cql'].length > 0) {
                        options['cql'] = options['cql'] + " AND workspace='" + mapObj.workspace + "' AND code='" + mapObj.code + "'";
                    } else {
                        options['cql'] = "workspace='" + mapObj.workspace + "' AND code='" + mapObj.code + "'";
                    }
                }
                //添加bbox；
                if (bbox) {
                    options = this.addBBOX(options, bbox);
                }

                data.query = JSON.stringify(options);
            } else {//无选项参数
                options = {};
                if (mapObj.code && mapObj.workspace) {
                    options['cql'] = "workspace='" + mapObj.workspace + "' AND code='" + mapObj.code + "'";
                }
                //添加bbox；
                if (bbox) {
                    options = this.addBBOX(options, bbox);
                }
                data.query = JSON.stringify(options);
            }
        } else {//非严格模式
            var options = {};
            if (obj && obj['options']) {//有选项参数
                options = JSON.parse(obj['options']);
                if (bbox) {
                    options = this.addBBOX(options, bbox);
                }
            } else {
                if (bbox) {
                    options['cql'] = bbox;
                }
                // options['cql']={};
            }
            data.query = JSON.stringify(options);
        }
        return data;
    }
    //添加bbox
    GenerateSource.prototype.addBBOX = function (obj, bbox) {
        if (bbox) {
            if (obj.hasOwnProperty('cql')) {
                obj['cql'] += "AND" + bbox;
            } else {
                obj['cql'] = bbox;
            }
        }
        return obj;
    }
    //是否过滤要素标识，如果不过滤先调用这个方法；
    GenerateSource.prototype.ifFilterFeature = function (evt) {
        this.filterFeature = evt;
    }
    GenerateSource.prototype.getSourceSuccess = function (obj, data) {
        var self = this;
        var features = new ol.format.GeoJSON().readFeatures(data);
        var code = obj.layer.get('code');
        var source = obj.layer.getSource();
        var param = {
            code: code,
            features: (features && features.length) ? features : [],
            func: self.reorgnizeFeature,
            layer: obj.layer,
            domain: self
        }
        self.dispatchEvent({type: 'vector-load-feature-success', param: param});
        //判断一下是聚合图层还是普通矢量图层；
        // self.vecLayerNum++;
        if (!self.filterFeature) {
            source.clear();
            if (source instanceof ol.source.Cluster) {
                source.getSource().addFeatures(features);
            } else {
                obj.layer.getSource().addFeatures(features);
            }
        }
        // 取到数据发送事件
        // if (self.vecLayerNum == self.vecLength) {
        //     self.dispatchEvent({type: 'vector-load-success', param: self.layerArr})
        // }
    }
    GenerateSource.prototype.reorgnizeFeature = function (param) {

        if (param && param.param && param.param.layer && param.param.features) {
            var _this = this.domain;
            var features = this.features;
            var layer = this.layer;
            if (layer && layer instanceof ol.layer.Vector) {
                var source = layer.getSource();
                if (source && source instanceof ol.source.Cluster) {
                    source = source.getSource();
                }
                // layer.getSource().clear();
                // layer.getSource().addFeatures(features);
                source.clear();
                source.refresh();
                source.addFeatures(features);

            }
            // _this.vectorResponseCount++;
            // if (_this.vecLength == _this.vectorResponseCount) {
            //     _this.dispatchEvent({type: 'load-feature-success', param: '数据加载成功'});
            // }
        } else {
            // var _this = this.domain;
            // _this.vectorResponseCount++;
            // if (_this.vecLength == _this.vectorResponseCount) {
            //     _this.dispatchEvent({type: 'load-feature-success', param: '数据加载成功'});
            // }
        }
    }
    GenerateSource.prototype.getVectorSource = function (arr, operateType) {
        // this.vecLength = arr.length;
        var self = this;
        var mapObj = self.setMapCodeAndWorkspace();

        // for (var i = 0; i < arr.length; i++) {
        for (var i in arr) {
            var obj = arr[i];
            //统计矢量总数
            if (!this.featureLoadFinishFlag) {
                this.layerTotal++;
            }
            var data = self.generateOptions(obj, mapObj);
            (function (obj, data) {
                // var ajax = new Ajax();
                Ajax.ajax({
                    //url: self.gisContext + "web/featureData" + "/" + obj.workspaceId + "/" + obj.code,
					url:self.featureDataUrl+ "/" + obj.workspaceId + "/" + obj.code, //修改成业务获取数据源的透传接口
                    method: 'get',
                    // type: 'GET',
                    data: data,
                    dataType: 'json',
                    success: function (json) {
                        if (json && json.data) {
                            self.getSourceSuccess(obj, json.data);
                        } else {
                            self.dispatchEvent({
                                type: 'vector-load-feature-success',
                                param: {msg: "该图层无满足条件的要素", param: obj}
                            });
                            self.dispatchEvent({type: 'get-source-error', param: {msg: "获取数据源失败或该数据源无数据"}});
                        }
                        //判断是否加载完成
                        self.estimateLoadSourceFinish();
                        //    请求成功发送事件,通知map，恢复状态使用
                        self.updateExtentSourceSuccess(operateType, obj.workspaceId || "", obj.code || "");
                    },
                    error: function () {
                        //获取数据源失败
                        self.dispatchEvent({type: 'vector-load-feature-success', param: {msg: "获取数据源失败", param: obj}});
                        //
                        self.dispatchEvent({type: 'get-source-error', param: {msg: "获取数据源失败", param: e}});

                        //判断是否加载完成
                        self.estimateLoadSourceFinish();
                        //    请求成功发送事件,通知map，恢复状态使用
                        self.updateExtentSourceSuccess(operateType, obj.workspaceId || "", obj.code || "");
                    }
                })
            })(obj, data)
        }
        // if (arr.length == 0) {
        //     self.dispatchEvent({type: 'vector-load-success', param: self.layerArr});
        // }
    }
    //获取矢量数据源信息
    GenerateSource.prototype.getVectorSourceInfo = function (sourceId) {
        if (JSON.stringify(this.sourceVector) != "{}") {
            var item = this.sourceVector[sourceId];
            return item;
        }
    }
    //前端聚合图层数据源请求
    GenerateSource.prototype.getClusterSource = function (param, operateType) {
        var _this = this;
        var mapObj = this.setMapCodeAndWorkspace();
        if (param) {
            for (var i in param) {
                //总数添加前端聚合图层数量；

                if (!this.featureLoadFinishFlag) {
                    this.layerTotal++;
                }
                (function (i) {
                    var item = param[i];
                    var data = _this.generateOptions(item, mapObj);
                    var workspace;
                    if (item.workspace) {
                        workspace = item.workspace;
                    } else {
                        workspace = item.workspaceId;
                        data['wsType'] = 1;
                    }
                    // $.ajax({
                    Ajax.ajax({
                        // type: "GET",
                        method: 'GET',
                        // cache: false,
                        // dataType: 'json',
                        url: _this.gisContext + "web/featureData" + "/" + workspace + "/" + item.code + '/byLayer',
                        data: data,
                        // cache: false,
                        success: function (json) {
                            if (json && json.errorCode == "0" && json.data) {
                                _this.getSourceSuccess(item, json.data);
                            } else {
                                _this.dispatchEvent({
                                    type: 'vector-load-feature-success',
                                    param: {msg: "该图层无满足条件的要素", param: item}
                                });
                                _this.dispatchEvent({
                                    type: 'get-source-error',
                                    param: {msg: "获取数据源失败或无数据", param: json['errorMessage'] || ''}
                                });
                            }
                            //判断是否加载完成
                            _this.estimateLoadSourceFinish();
                            _this.dispatchEvent({type: "get-cluster-source-success", param: {data: json.data}});
                            //    请求成功发送事件,通知map，恢复状态使用
                            _this.updateExtentSourceSuccess(operateType, workspace, item.code || "");

                        },
                        error: function (e) {
                            //获取数据源失败
                            _this.dispatchEvent({
                                type: 'vector-load-feature-success',
                                param: {msg: "获取数据源失败", param: item}
                            });
                            _this.dispatchEvent({type: 'get-source-error', param: {msg: "获取数据源失败", param: e}});
                            //判断是否加载完成
                            _this.estimateLoadSourceFinish();
                            //    请求成功发送事件,通知map，恢复状态使用
                            _this.updateExtentSourceSuccess(operateType, workspace, item.code || "");

                        }
                    })
                })(i)
            }
            // for (var i = 0; i < arr.length; i++) {
            //     (function (item) {
            //         $.ajax({
            //             type: 'GET',
            //             url: _this.clusterSourceUrl,
            //             data: {},
            //             success: function (json) {
            //                 _this.dispatchEvent({
            //                     type: 'get-cluster-source-success',
            //                     param: {data: json['data'], layer: item.layer}
            //                 })
            //                 _this.clusterNum++;
            //             },
            //             error: function (err) {
            //                 console.log(err);
            //                 _this.clusterNum++;
            //             }
            //         })
            //     })(arr[i])
            // }
        }
    }
    //地图范围变更，获取数据源成功或失败，通知map恢复状态；
    GenerateSource.prototype.updateExtentSourceSuccess = function (operateType, workspace, code) {
        if (operateType == "extentUpdate") {
            this.dispatchEvent({
                type: 'update-extent-source-success',
                param: {workspace: workspace, code: code || ''}
            })
        }
    }

    //后端生成聚合图层数据源
    GenerateSource.prototype.generateClusterSourceByService = function (param, operateType) {
        var _this = this;
        var mapObj = this.setMapCodeAndWorkspace();
        for (var i in param) {
            //统计后端聚合图层数量
            if (!this.featureLoadFinishFlag) {
                this.layerTotal++;
            }
            (function (i) {
                var item = param[i];
                var layer = item['layer'];
                var data = _this.generateOptions(item, mapObj);
                var workspace;
                data['bbox'] = item['extent'].toString();
                data['width'] = item['width'];
                data['height'] = item['height'];
                if (item.workspace) {
                    workspace = item.workspace;
                } else {
                    workspace = item.workspaceId;
                    data['wsType'] = 1;
                }
                // $.ajax({
                Ajax.ajax({
                    url: _this.gisContext + 'web/featureData/' + workspace + '/' + item['code'] + '/hgisClusterByLayer',
                    method:'GET',
                    // type: 'GET',
                    // cache: false,
                    // dataType: 'json',
                    data: data,
                    success: function (data) {
                        _this.dispatchEvent({
                            type: 'generate-cluster-source-success',
                            param: {source: data, layer: layer}
                        });
                        if (data && data.errorCode === "0" && data.data) {
                            _this.getSourceSuccess(item, data.data);
                        } else {
                            _this.dispatchEvent({
                                type: 'vector-load-feature-success',
                                param: {msg: "该图层无满足条件的要素", param: item}
                            });
                            _this.dispatchEvent({
                                type: 'get-source-error',
                                param: {msg: "获取数据源失败或无数据", param: data['errorMessage']}
                            });
                        }
                        //判断是否加载完成
                        _this.estimateLoadSourceFinish();
                        //    请求成功发送事件,通知map，恢复状态使用
                        _this.updateExtentSourceSuccess(operateType, workspace, item.code || "");
                    },
                    error: function (e) {
                        //获取数据源失败
                        _this.dispatchEvent({
                            type: 'vector-load-feature-success',
                            param: {msg: "获取数据源失败", param: item}
                        });
                        _this.dispatchEvent({type: 'get-source-error', param: {msg: "调用hgis服务失败", param: e}});

                        //判断是否加载完成
                        _this.estimateLoadSourceFinish();
                        //    请求成功发送事件,通知map，恢复状态使用
                        _this.updateExtentSourceSuccess(operateType, workspace, item.code || "");
                    }
                })
            })(i)
        }
    }
    GenerateSource.prototype.generateHeatmapSource = function (param) {
        if (param) {
            var mapObj = this.setMapCodeAndWorkspace();
            var _this = this;
            for (var i in param) {
                if (!this.featureLoadFinishFlag) {
                    this.layerTotal++;
                }
                (function (i) {
                    var item = param[i];
                    var workspace;
                    var data = _this.generateOptions(item, mapObj);
                    if (item.workspace) {
                        workspace = item.workspace;
                    } else {
                        workspace = item.workspaceId;
                        data['wsType'] = 1;
                    }
                    // $.ajax({
                    Ajax.ajax({
                        method:'GET',
                    //     type: 'GET',
                    //     cache: false,
                        url: _this.gisContext + 'web/featureData/' + workspace + '/' + item['code'] + '/hgisClusterByLayer',
                        data: data,
                        // dataType: 'json',
                        success: function (json) {
                            if (json && json.errorCode === "0" && json.data) {
                                if (json.data) {
                                    _this.getSourceSuccess(item, json.data);
                                }
                            } else {
                                _this.dispatchEvent({
                                    type: 'vector-load-feature-success',
                                    param: {msg: "该图层无满足条件的要素", param: item}
                                });
                                _this.dispatchEvent({
                                    type: 'get-source-error',
                                    param: {msg: "获取数据源失败或无数据", param: json['errorMessage']}
                                });


                            }
                            //判断是否加载完成
                            _this.estimateLoadSourceFinish();
                            _this.dispatchEvent({type: 'get-heatmap-source-success', param: json.data || {}})
                        },
                        error: function (e) {
                            //获取数据源失败
                            _this.dispatchEvent({
                                type: 'vector-load-feature-success',
                                param: {msg: "获取数据源失败", param: item}
                            });
                            _this.dispatchEvent({type: 'get-source-error', param: {msg: "调用hgis服务失败", param: e}});
                            //判断是否加载完成
                            _this.estimateLoadSourceFinish();
                        }
                    })

                })(i)
            }
        }
    }
    //基于后端生成热力图
    GenerateSource.prototype.getHeatmapSourceByRest = function (param) {
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
                            url: _this.engineUrl + "rest/wms/hgisHeatmap",
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
    GenerateSource.prototype.estimateLoadSourceFinish = function () {
        this.layerTotal--;
        if (this.layerTotal === 0 && !this.featureLoadFinishFlag) {
            //矢量图层加载完成
            this.dispatchEvent({type: 'load-vector-success', param: {msg: "矢量数据加载成功！"}});
            // this.dispatchEvent({type: 'load-vector-success', param: {msg: "矢量数据加载成功！"}});
            //要素全部加载完成
            this.dispatchEvent({type: 'load-feature-success', param: '最后一次加载失败'});
            this.featureLoadFinishFlag = true;

        }
    }
    //静态图层数据源
    GenerateSource.prototype.getImageSource = function (param) {
        var source;
        if (param && param['type']) {
            var type = param['type'];
            var extent = param['extent'];
            var options = param['options'];
            switch (type) {
                case "imageArcGISRest": {
                    source = new ol.source.ImageArcGISRest({
                        url: param['url'],
                        crossOrigin: 'Anonymous',
                        ratio: 1.5
                    })
                    break;
                }
                case "imageStatic": {
                    var url = this.changeUrlforContext(param['url']);
                    source = new ol.source.ImageStatic({
                        url: param['url'],
                        projection : param['projection'],
                        imageExtent: extent
                    })
                    break;
                }
                case "imageWMS": {
                    var params;
                    if (options) {
                        options = JSON.parse(options) || {};
                        options.url = param['url'];
                        params = options;
                    } else {
                        params = {
                            url: param['url']
                        };
                    }
                    source = new ol.source.ImageWMS(params);
                    break;
                }
                default: {
                    break;
                }
            }
            return source;
        }

    }
    //替换上下文
    GenerateSource.prototype.changeUrlforContext = function (url) {
        if (url) {
            var gisContext = this.isContains(url, "gisContext");
            var sysContext = this.isContains(url, "sysContext");
            var ctxRegEx = /\{sysContext\}/g;
            var gisRegEx = /\{gisContext\}/g;
            if (gisContext && this.gisContext) {
                url = url.replace(gisRegEx, this.gisContext);
            } else if (sysContext && this.sysContext) {
                url = url.replace(ctxRegEx, this.sysContext);
            }
        }
        return url;
    }
    //判断某个字符串是否包含子字符串的方法
    GenerateSource.prototype.isContains = function (str, subStr) {
        return new RegExp(subStr).test(str);
    }

    //

    //获取图层总数量
    GenerateSource.prototype.setLayerNum = function (num) {
        if (num) {
            this.layerTotal = num;
        }
    }
    // return GenerateSource;
    export default GenerateSource
// })
