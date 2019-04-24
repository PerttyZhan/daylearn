// define('gais/map/MapManager', [
//         'ol',
//         'gais/map/GenerateMap',
//         'gais/map/MapContant',
//         'require',
//         // 'axios'
//         'gais/map/Ajax'
//     ],
    // function (ol, GenerateMap, MapContant, require, Ajax) {
        import ol from './ol'
        import GenerateMap from './GenerateMap'
        import MapContant from './MapContant'
        import Ajax from './Ajax'
        import Zoom from './zoom'
        var MapManager = function (opts) {
            ol.Object.call(this);
            if (opts) {
                this.init(opts);
            }
        }
        ol.inherits(MapManager, ol.Object);
        //初始化
        MapManager.prototype.init = function (opts) {
            this.components = []; //地图组件依赖路径数组
            this.componentsBox = {};
            if (opts) {
                if (opts.hasOwnProperty('context')) {
                    this.gisContext = opts.context.gisContext || '';
                    this.sysContext = opts.context.sysContext || '';
                    this.proxyContext = opts.context.proxyContext || '';
                }
                if (opts.hasOwnProperty('map')) {
                    this.target = opts.map.target || undefined;
                    this.mapWorkspace = opts.map.workspace || '';
                    this.mapCode = opts.map.map || '';
                }
                if (opts.hasOwnProperty('component')) {
                    // this.components
                    for (var i in opts.component) {
                        this.components.push(i);
                        this.componentsBox = opts.component;
                    }
                }
                //业务透传接口url
                if(opts.hasOwnProperty('sysUrl')) {
                    this.tmapUrl = opts.sysUrl.tmapUrl || '';   //获取专题地图接口url
                    this.featureDataUrl = opts.sysUrl.featureDataUrl || '';    //获取要素数据接口url；
                }
            }
            //-----------图层组切换---------------//
            this.layerGroup = [];
            this.currentLayerGroup = null;


            //------------------地图控件------------------------------
            this.measureTool = null;      //地图测量控件
            this.homeTool = null;         //地图复位控件
            this.featureEditorTool = null;      //地图要素编辑控件
            this.rotateTool = null;          //地图旋转控件
            this.zoomTool = null;           //地图缩放控件；
            this.layerManagerTool = null;    //地图图层管理控件；
            this.featureSelectTool = null;   //拉框查询控件；
            this.layerGroupTool = null;      //图层组切换控件；
            this.vueFlag = false;   //是否有vue组件

            this.layerArr = [];
            this.initFlag = false;

        }

        //根据专题地图工作空间编码以及专题地图编码获取专题地图配置信息
        MapManager.prototype.getMapConfInfo = function () {
            // if (this.mapCode && this.mapWorkspace && axios && this.gisContext) {
            if (this.mapCode && this.mapWorkspace && Ajax && this.gisContext) {
                var _this = this;
                // var url = this.gisContext + 'web/tmap/' + this.mapWorkspace + '/' + this.mapCode + '?detail=true';
               // var url = this.gisContext + 'web/tmap/' + this.mapWorkspace + '/' + this.mapCode;
				var url = this.tmapUrl +'/'+ this.mapWorkspace + '/' + this.mapCode;      //修改成透传的接口；
				
                var data = {
                    detail: true
                    // stamp: new Date().getTime()
                };

                Ajax.ajax({
                    url: url,
                    method: 'GET',
                    data: data,
                    success: function (data) {
                        if (data && data.data) {
                            _this.themap = new GenerateMap({
                                map: _this.map,
                                gisContext: _this.gisContext,
                                sysContext: _this.sysContext,
                                proxyContext: _this.proxyContext,
								featureDataUrl: _this.featureDataUrl,   //透传接口获取数据
                                json: data.data
                            })
                            _this.themap.init();
                            //    监听视图设置成功事件
                            _this.themap.on('set-view-success', _this.setViewSuccess, _this);
                            //    监听地图图层组加载完成
                            _this.themap.on('group-success', _this.generateGroupSuccess, _this);
                            //    监听地图图层加载成功
                            _this.themap.on('vector-load-success', _this.loadVectorLayerSuccess, _this);
                            //    监听地图要素加载成功
                            _this.themap.on('vector-load-feature-success', _this.loadFeatureSuccess, _this);
                            //    数据源获取失败
                            _this.themap.on('get-source-error', _this.loadSourceFailed, _this);
                            //    生成专题地图
                            _this.themap.generateThematicMap();
                        }

                    },
                    error: function (error) {
                        console.log(error)

                    }

                })
            }
        }
        //初始化地图
        MapManager.prototype.initMap = function () {

            this.map = new ol.Map({
                target: this.target,
                renderer: 'canvas',
                //layers: [layer],
                controls: ol.control.defaults({
                    zoom: false,
                    attribution: false
                })
            })
        
            // this.ep.emit('map-init-success', {data: 'map init success'});
            this.getMapConfInfo();
        }
        //检查一下是否有vue控件；
        MapManager.prototype.detectVue = function () {
            var vueFlag = false;
            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var item = this.components[i];
                    var arr = item.split("/");
                    for (var j = 0; j < arr.length; j++) {
                        if (arr[j] == "vue") {
                            vueFlag = true;
                            break;
                        }
                    }
                }
            }
            if (vueFlag) {
                var _this = this;
                // require('vue', function (Vue) {
                //     _this.Vue = Vue;

                // })
            }
        }

//        引入依赖地图控件的依赖
        MapManager.prototype.initMapControl = function () {
            var vueFlag = false;
            if (this.components && this.components.length) {
                for (var i = 0; i < this.components.length; i++) {
                    var item = this.components[i];
                    var arr = item.split("/");
                    for (var j = 0; j < arr.length; j++) {
                        if (arr[j] == "vue") {
                            vueFlag = true;
                            break;
                        }
                    }
                }
            }
            if (vueFlag) {
                var _this = this;
                // require(['vue'], function (Vue) {
                //     _this.Vue = Vue;
                //     _this.requireControls();
                // })
            }
        }
        MapManager.prototype.requireControls = function () {
            var _this = this;
            if (this.components.length) {
                try {
                    // require(this.components, function () {
                    //     for (var i = 0; i < _this.components.length; i++) {
                    //         var arr = _this.components[i].split("/");
                    //         // var type = _.filter(arr, function (elem) {
                    //         //     if (elem == "vue") {
                    //         //         //记录所需加载的css
                    //         //         cssArr.push(_this.components[i])
                    //         //         _this.vueFlag = true;
                    //         //         return true;
                    //         //     }
                    //         // })
                    //         var type = false;
                    //         for (var j = 0; j < arr.length; j++) {
                    //             if (arr[j] == "vue") {
                    //                 type = true;
                    //                 _this.vueFlag = true;
                    //             }
                    //         }

                    //         var key = _this.components[i];
                    //         var item = _this.componentsBox[key];
                    //         item['component'] = arguments[i];
                    //         _this.componentsBox[_this.components[i]]['component'] = arguments[i];
                    //         _this.componentsBox[_this.components[i]]['path'] = _this.components[i];
                    //         _this.componentsBox[_this.components[i]]['name'] = arr[arr.length - 1];
                    //         // _this.componentsBox[_this.components[i]]['type'] = type.length > 0 ? true : false;   //判断类型是否为vue组件
                    //         _this.componentsBox[_this.components[i]]['type'] = type;   //判断类型是否为vue组件
                    //     }

                    //     // if (_this.vueFlag) {
                    //     //     _this.initVue()
                    //     // }
                    //     _this.dispatchEvent({type: MapContant.preLoadComponentSuccess, param: _this.components});
                    //     // _this.ep.emit('did-load-component-success', {data: 'component load success'})
                    //     _this.addComponents(_this)
                    // })

                } catch (e) {
                    _this.dispatchEvent({type: MapContant.preLoadComponentFailed, param: _this.components});
                }
            }

        }

//        添加控件
        MapManager.prototype.addComponents = function (self) {
            if (self && self.componentsBox) {
                for (var i in self.componentsBox) {
                    var item = self.componentsBox[i];
                    //地图控件为非vue控件；
                    if (item) {
                        if (item['name'] && !item['type']) {
                            self.addCommonMapTool(item);
                        } else {
                            self.addVueTool(item);
                        }
                    }
                }
            }
        }
        //向页面添加css文件
        MapManager.prototype.addComponentCss = function (arr) {
            for (var i = 0; i < arr.length; i++) {
                var head = document.getElementsByTagName('head')[0];
                var link = document.createElement('link');
                link.href = arr[i] + '.css';
                link.rel = 'stylesheet';
                link.type = 'text/css';
                head.appendChild(link);
            }
        }
//        添加vue控件
        MapManager.prototype.addVueTool = function (item) {
            // var param = {map: this.map}
            // require('vue',function (Vue) {
            if (item.hasOwnProperty('name')) {
                var param = this.getVueConponetParam(item)
                var name = item['name']
                var div = document.createElement('div');
                div.id = name;
                var body = document.getElementsByTagName('body')[0];
                body.appendChild(div)
                //设置样式
                if (item.hasOwnProperty('position')) {
                    var position = item['position'];
                    var style = "";
                    for (var i in position) {
                        // div.style.i= position[i];
                        style += i + ":" + position[i] + ";";

                        // div.setAttribute(i, position[i]);
                    }
                    // div.style = style;
                    div.style.cssText=style;
                }

                // div.style = "position:absolute;right:100px;bottom:50px;"
                var html = '<' + name + ' :param="param"></' + name + '>';
                div.innerHTML = html;

                if(this.Vue){
                    var component = this.Vue.component(name, item['component']);
                    new this.Vue({
                        el: '#' + name,
                        data: {
                            param: param
                        },
                        methods: {}
                    })
                }

            }

            // })

        }
        //获取vue组件的参数
        MapManager.prototype.getVueConponetParam = function (item) {
            if (item && item['path'] && this.componentsBox) {
                var key = item['path'];
                var elem = this.componentsBox[key];
                if (elem && item['name']) {
                    switch (item['name']) {
                        case 'featureedit': {
                            var arr = elem['layers'] || [];
                            return {
                                map: this.map,
                                layers: this.getLayerArr(arr)  //需要参数指定
                            }
                        }
                        case 'featureselect': {
                            if (elem['layerArr']) {
                                var arr = elem['layerArr'] || [];
                                return {
                                    map: this.map,
                                    layerArr: this.getLayerArr(arr),
                                    type: params['type'] || '',
                                    selectUrl: params['selectUrl'] || ''
                                }
                            }
                        }
                        case 'home': {
                            return {
                                map: this.map
                            }
                        }
                        // case 'maptype': {   //无需参数外部指定
                        //     return {}
                        // }
                        case 'layermanager': {
                            var arr = elem['layerArr'] || [];
                            var layers = this.getLayerArr(arr);
                            return {
                                layerArr: layers.length > 0 ? layers : this.layerArr
                            }
                        }
                        case 'measure': {
                            return {
                                map: this.map
                            }

                        }
                        case 'rotate': {
                            return {
                                map: this.map,
                                rotation: (elem && elem['rotation']) ? elem['rotation'] : 0,       //参数需要设置
                                deltaRotation: (elem && elem['deltaRotation']) ? elem['deltaRotation'] : Math.PI / 2     //旋转步长需要参数指定；
                            }
                        }
                        case 'zoom': {
                            return {
                                map: this.map
                            }

                        }
                        case 'layergroupswitcher': {
                            return {
                                map: this.map,
                                layerGroups: this.layerGroup || []
                            }
                        }
                        default: {
                            return {}
                        }
                    }
                }
            }
        }
        //获取图层管理器参数
        MapManager.prototype.getLayerArr = function (arr) {
            var layerArr = [], _this = this;
            if (arr && arr.length) {

                // _.forEach(arr, function (value) {
                for (var i = 0; i < arr.length; i++) {
                    var value = arr[i];
                    var paramArr = value.split(":");
                    if (paramArr.length) {
                        var layer = _this.getLayerByCodeAndWsCode(paramArr[0], paramArr[1]);
                        if (layer && layer instanceof ol.layer.Vector) {
                            layerArr.push(layer);
                        }
                    }
                }

                // })
            }

            return layerArr;
        }
        //根据图层编码与工作空间编码获取图层
        MapManager.prototype.getLayerByCodeAndWsCode = function (code, wsCode) {
            if (this.layerArr.length && code && wsCode) {
                for (var i = 0; i < this.layerArr.length; i++) {
                    var layer = this.layerArr[i];
                    if (layer) {
                        var layerCode = layer.get('code');
                        var workCode = layer.get('workspace');
                        if (layerCode == code && wsCode == workCode) {
                            return layer;
                        }
                    }
                }
            }
        }
        //根据编码获取图层组
        MapManager.prototype.getLayerGroup = function (gCode, gWsCode) {
            var arr = [];
            if (this.layerGroup && this.layerGroup.length && gCode && gWsCode) {

                for (var i = 0; i < this.layerGroup.length; i++) {
                    var item = this.layerGroup[i];
                    var code = item.get('code');
                    var wsCode = item.get('workspace');
                    if (code == gCode && wsCode == gWsCode) {
                        arr.push(item);
                    }

                }
                // _.filter(_this.layerGroup, function (item) {
                //     var code = item.get('code');
                //     var wsCode = item.get('workspace');
                //     if (code == gCode && wsCode == gWsCode) {
                //         return item;
                //     }
                // })
            }
            return arr;
        }
        //获取图层组数组

//        添加地图非vue工具
        MapManager.prototype.addCommonMapTool = function (item) {
            var _this = this, params = null;
            if (item && item['component']) {
                var Component = item['component'];
                var key = item['path'];
                if (key && this.componentsBox && this.componentsBox[key]) {
                    params = this.componentsBox[key];
                }
                var param = {};
                switch (item['name']) {
                    case 'LayerManager': {
                        if (params) {
                            var arr = param['layerArr'] || [];
                            param = {
                                layerArr: this.getLayerArr(arr)
                            }
                        }
                        // param = {
                        //     layerArr: this.layerArr
                        // }
                        this.layerManagerTool = new Component(param);
                        this.layerManagerTool.init();
                        break;
                    }
                    case 'Measure' : {
                        param = {
                            map: this.map
                        }
                        this.measureTool = new Component(param);
                        this.measureTool.init();
                        break;
                    }
                    case 'Home' : {
                        param = {
                            map: this.map
                        }
                        this.homeTool = new Component(param);
                        this.homeTool.init();
                        break;
                    }
                    case 'Rotate' : {
                        param = {
                            map: this.map,
                            rotation: (params && params['rotation']) ? params['rotation'] : 0,       //参数需要设置
                            deltaRotation: (params && params['deltaRotation']) ? params['deltaRotation'] : Math.PI / 2     //旋转步长需要参数指定；
                        }
                        this.rotateTool = new Component(param);
                        this.rotateTool.init();
                        break;
                    }
                    case 'FeatureEditor': {
                        var arr;
                        if (params) {
                            arr = params['layers'] || [];
                        }
                        param = {
                            map: this.map,
                            layers: this.getLayerArr(arr)  //需要参数指定
                        }
                        this.featureEditorTool = new Component(param);
                        this.featureEditorTool.init();
                        break;
                    }
                    case 'MapType' : {
                        var layers = [];
                        if (params && params['layerGroups']) {
                            var arr = params['layerGroups'];

                            for (var i = 0; i < arr.length; i++) {
                                var item = arr[i];
                                var paramsArr = item.split(':');
                                var group = _this.getLayerGroup(paramsArr[0], paramsArr[1]);
                                if (group.length) {
                                    layers.push(group[0]);
                                }
                            }

                            // layers = _.each(arr, function (item) {
                            //     var paramsArr = item.split(':');
                            //     var layers = _this.getLayerGroup(paramsArr[0], paramsArr[1]);
                            //     if (layers.length) {
                            //         return layers[0];
                            //     }
                            // })

                        }
                        param = {
                            layerGroups: layers//需要参数指定
                        }
                        this.layerGroupTool = new Component(param);
                        this.layerGroupTool.init();
                        break;
                    }
                    case 'FeatureSelect': {
                        if (params) {
                            var arr = params['layerArr'] || [];
                            param = {
                                map: this.map,
                                layerArr: this.getLayerArr(arr),
                                type: params['type'] || '',
                                selectUrl: params['selectUrl'] || ''
                            }
                        }
                        this.featureSelectTool = new Component(param);
                        this.featureSelectTool.on('select-by-ol-success', function (param) {
                            _this.dispatchEvent({type: 'select-by-ol-success', param: param['param']})
                        })
                        this.featureSelectTool.init();

                        break;
                    }
                    default: {
                        break;
                    }
                }
            }
        }
//    抛出地图视图设置成功事件
        MapManager.prototype.setViewSuccess = function (param) {
            if (param && param.param) {
                this.dispatchEvent({type: MapContant.setViewSuccess, param: param.param})
            }
            // 设置放大缩小控件
            this.zoomTool = new Zoom({map: this.map})
            this.zoomTool.init()
        }
        //    图层组加载成功
        MapManager.prototype.generateGroupSuccess = function (param) {
            if (param && param.param) {
                this.layerGroup = param['param']
                if (this.layerGroup && this.layerGroup.length) {
                    this.currentLayerGroup = this.layerGroup[0]
                }
                this.dispatchEvent({type: MapContant.loadGroupSuccess, param: param.param})
            }
        }
        //    加载矢量图层成功
        MapManager.prototype.loadVectorLayerSuccess = function (param) {
            if (param && param.param) {
                this.initMapControl();
                this.dispatchEvent({type: MapContant.loadVectorLayerSuccess, param: param.param});
                if (param && param['param'] && param['param']['layers'] && param['param']['layers'].length){
                    this.layerArr = param['param']['layers'];
                }
            }
        }
        //    要素加载成功
        MapManager.prototype.loadFeatureSuccess = function (param) {
            if (param && param.param) {
                // this.addLayer();
                if (!this.initFlag) {
                    //this.initMapControl();
                    this.initFlag = true;
                }

                this.dispatchEvent({type: MapContant.loadFeatureSuccess, param: param.param})
            }
        }
        //获取矢量数据源失败
        MapManager.prototype.loadSourceFailed = function (param) {
            if (param && param.param) {
                this.dispatchEvent({type: MapContant.loadSourceError, param: param.param})
            }
        }

        MapManager.prototype.updateStatus = function (param) {
            if (this.themap) {
                this.themap.updateStatus(param)
            }

        }

        //--------------1.测量组件接口--------//
        //测距
        MapManager.prototype.measureLength = function () {
            if (this.measureTool) {
                this.measureTool.measureLength();
            }
        }
        //测面
        MapManager.prototype.measureArea = function () {
            if (this.measureTool) {
                this.measureTool.measureArea()
            }
        }
        //---------------2.拉框查询接口--------//
        MapManager.prototype.selectFeatures = function () {
            if (this.featureSelectTool) {
                this.featureSelectTool.selectFeatures();
            }
        }
        //----------------3.缩放接口--------------//
        //放大
        MapManager.prototype.zoomOut = function () {
            if (this.zoomTool) {
                this.zoomTool.zoomOut();
            }
        }
        //缩小
        MapManager.prototype.zoomIn = function () {
            if (this.zoomTool) {
                this.zoomTool.zoomIn();
            }
        }
        //------------------4.旋转------------------//
        //回正北
        MapManager.prototype.reset = function () {
            if (this.rotateTool) {
                this.rotateTool.reset();
            }
        }
        //左旋转
        MapManager.prototype.leftRotation = function () {
            if (this.rotateTool) {
                this.rotateTool.leftRotation()
            }
        }
        //右旋转
        MapManager.prototype.rightRotate = function () {
            if (this.rotateTool) {
                this.rotateTool.rightRotate();
            }
        }
        //-------------------5.复位-------------------//
        MapManager.prototype.home = function () {
            if (this.homeTool) {
                this.homeTool.home();
            }
        }
        //-------------------6.要素编辑----------------------------------//
        MapManager.prototype.rotateAndZoom = function () {
            if (this.featureEditorTool) {
                this.featureEditorTool.rotateAndZoom();
            }
        }
        MapManager.prototype.vertexEdit = function () {
            if (this.featureEditorTool) {
                this.featureEditorTool.vertexEdit();
            }
        }
        MapManager.prototype.finishEdit = function () {
            if (this.featureEditorTool) {
                this.featureEditorTool.clearRotateAndZoomAndVertex();
            }
        }
        //------------------7.图层管理器------------------------------------//
        MapManager.prototype.changVisible = function () {
            if (this.layerManagerTool) {
                this.layerManagerTool.changVisible()
            }
        }
        //--------------------8.图层组切换组件-----------------------------------//
        MapManager.prototype.changeLayerGroup = function () {
            if (this.layerGroupTool) {
                this.layerGroupTool.changeLayerGroup();
            }
        }

        //--------------测试数据-------------------------------------//
        MapManager.prototype.addLayer = function () {
            if (this.map) {
                var polygon = this.generatePolygonLayers();
                this.map.addLayer(polygon);
                var point = this.generatePointLayer();
                this.map.addLayer(point);
                var lineString = this.generateLineString();
                this.map.addLayer(lineString);
                this.layerArr.push(point);
                this.layerArr.push(polygon);
                this.layerArr.push(lineString);
            }
        }
        MapManager.prototype.generatePolygonLayers = function () {
            var polygonLayer = new ol.layer.Vector({
                name: '面图层',
                code: 'polygon',
                workspace: 'default',
                id: 3,
                zIndex: 100,
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(195,201,124,1)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: 'rgba(195,201,124,1)'
                    })
                })
            });

            var geom = new ol.geom.Polygon([
                [
                    [13307030.57690708, 3474570.5997297447],
                    [13459293.137251152, 3486800.524255373],
                    [13482529.993849844, 3394464.59408688],
                    [13278901.750498138, 3448276.261999645],
                    [13307030.57690708, 3474570.5997297447]
                ]
            ]);
            var feature = new ol.Feature({
                name: '面1',
                type: 'polygon',
                geometry: geom
            });
            polygonLayer.getSource().addFeature(feature);
            return polygonLayer;
        }
        MapManager.prototype.generatePointLayer = function () {
            var pointLayer = new ol.layer.Vector({
                name: '点图层',
                code: 'point',
                workspace: 'default',
                id: 1,
                zIndex: 103,
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: 8,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        }),
                        stroke: new ol.style.Stroke({
                            color: 'white',
                            width: 2
                        })
                    })
                })
            });
            var arr = [
                [13331433.061236445, 3463360.917740862],
                [13447617.344229914, 3426671.144163977],
                [13430495.449894033, 3465806.9026459875],
                [13391359.691412024, 3462137.9252882986],
                [13397474.653674837, 3442570.0460472936],
                [13371259.935687259, 3399571.0764812296]
            ];
            for (var i = 0; i < arr.length; i++) {
                var item = arr[i];
                var geom = new ol.geom.Point(item);
                var feature = new ol.Feature({
                    name: '点' + i,
                    id: i,
                    type: 'point',
                    geometry: geom
                });
                pointLayer.getSource().addFeature(feature);
                return pointLayer;
            }
        }
        MapManager.prototype.generateLineString = function () {
            var lineLayer = new ol.layer.Vector({
                name: '线图层',
                code: 'line',
                workspace: 'default',
                id: 2,
                zIndex: 102,
                source: new ol.source.Vector(),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#ff8170',
                        width: 2
                    })
                })
            });

            var geom = new ol.geom.LineString([
                [13352915.048898816, 3535323.2387157027],
                [13371259.935687259, 3399571.0764812296],
                [13509458.082826857, 3445433.2934523355]
            ]);
            var feature = new ol.Feature({
                name: '线',
                type: 'linestring',
                geometry: geom
            });
            lineLayer.getSource().addFeature(feature);
            return lineLayer;
        }
        // 获取层级
MapManager.prototype.getLevel=function(){
    return this.map.getView().getZoom();
}
// 获取中心点
MapManager.prototype.getCenter=function(){
    return this.map.getView().getCenter();
}
// 设置层级
MapManager.prototype.setLevel=function(level){
    var view=this.map.getView();
    if(level){
        view.setZoom(level);
    }
}
// 设置中心点
MapManager.prototype.setCenter=function(center){
    var view=this.map.getView();
    if(center){
       view.setCenter([parseFloat(center[0]),parseFloat(center[1])]);
    }
}
// 绘制点线面
MapManager.prototype.draw=function (code, wsCode,type) {
  if(code && wsCode){
    var layer=this.getLayerByCodeAndWsCode(code,wsCode);
    var styleParam = this.themap.getLayerStyleConfId(code, wsCode);
    var style=layer.getStyle();
    var source=layer.getSource();
    this.drawArea=new ol.interaction.Draw({
      type:type,
      source:source
//       style:function(feature){
//         console.log(style(styleParam['styleId'],feature));
//         return style(styleParam['styleId'],feature);
//       }
    }); 
    this.snap=new ol.interaction.Snap({
      source:source
    });
    this.map.addInteraction(this.drawArea);
    this.map.addInteraction(this.snap);
    var _this = this
    // this.drawArea.on('drawstart', function (e) {
    //     e.feature.setStyle(style(styleParam['styleId'],e.featyre));
    // })
    this.drawArea.on('drawend', function (e) {
      var points=e.feature.getGeometry().getCoordinates();

    //   var geom = e.feature.getGeometry();
    //   if(geom instanceof ol.geom.LineString){

    //   }else if(geom instanceof ol.geom.Polygon){
    //     var coor=  geom.getInteriorPoint()

    //   }else if(geom instanceof ol.geom.Point){

    //   }
      _this.dispatchEvent({type:MapContant.drawEnd, param: e.feature, points: points})
    });
  }
}
MapManager.prototype.removeDraw=function () {
  this.map.removeInteraction(this.drawArea);
  this.map.removeInteraction(this.snap);
  this.drawArea=null;
  this.snap=null;
}; 
MapManager.prototype.setCurrent=function (code,wsCode) {
  this.currentCode=code;
  this.currentWsCode=wsCode;
}
MapManager.prototype.addMapClickListen=function () {
  var self=this;
  this.map.on("click",function (e) {
    var pixelPoint = e.pixel;
    if (pixelPoint != undefined) {
          self.map.forEachFeatureAtPixel(pixelPoint, function (feature,layer) {
    if(layer) {
             if (feature && feature != undefined) {
               var point = self.map.getCoordinateFromPixel(pixelPoint)
               var code = layer.get('code')
               self.dispatchEvent({type: MapContant.mapClick, param: {feature: feature, point: point, code: code}})
             }
           }
      });
    }
  })
} 
MapManager.prototype.removeFeature=function (code,wsCode,feature) {
  if(code && wsCode){
    var layer=this.getLayerByCodeAndWsCode(code,wsCode);
    var source=layer.getSource();
    source.removeFeature(feature);
  }
}
// 根据数据绘制图层
MapManager.prototype.addFeature=function (code,wsCode,data) {
  this.themap.addFeatureToNoneResourceLayer(code,wsCode,data);
};
// 弹窗 element是内容,position位置
MapManager.prototype.showOverlay=function (element,position) {
  if(element && position){
    this.overlay.setElement(element);
    this.overlay.setPosition(position);
  }
};
MapManager.prototype.removeOverlay=function () {
    this.overlay.setPosition(null);
}
MapManager.prototype.initOverlay=function () {
    var container=document.getElementById('popup');
    this.overlay=new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
            duration: 250
        }
    });
    this.map.addOverlay(this.overlay);
};
// 控制图层显隐
MapManager.prototype.setLayerVisiable=function (code,wsCode,visiable) {
  this.themap.setLayerVisiable(code,wsCode,visiable);
}; 

// 多弹窗
MapManager.prototype.addMultiOverlay=function (param, multiDom) {
  var self=this;
  if(param.length>0){
    var collection=new ol.Collection();
    for(var i=0;i<param.length;i++){
      var one=param[i];
      var container=document.getElementById(one['id']);
      multiDom[one['id']] = {show: true}
//       var con=document.getElementById(one['conId']);
//       con.innerHTML=one['html'];
      var overlay=new ol.Overlay({
        id:one['id'],
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250
        }
      });
      overlay.setPosition(one['coordinate']);
      collection.push(overlay);
    }
    collection.forEach(function (overlay, index, array) {
      self.map.addOverlay(overlay);
    })
  }
}
MapManager.prototype.setOverlayById=function (id, position) {
  var overlay=this.map.getOverlayById(id);
  overlay.setPosition(position);
}
MapManager.prototype.claseOverlayById=function (id) {
  var overlay=this.map.getOverlayById(id);
  overlay.setPosition(null);
}
// 根据elementId获取Feature
MapManager.prototype.getFeature=function (code,wsCode,id) {
  var layer=this.getLayerByCodeAndWsCode(code,wsCode);
  var features=layer.getSource().getFeatures();
  for(var i=0;i<features.length;i++){
    var feature=features[i];
    if(feature.getProperties().elementId ==id){
      return feature
    }
  }
  return null;

} 
export default MapManager