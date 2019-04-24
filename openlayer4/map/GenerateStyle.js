/**
 * Created by tangwenjing on 2017/10/9.
 */
// define('gais/map/GenerateStyle', ['ol', 'gais/map/StatusMange'], function (ol, StatusMange) {
    import ol from './ol'
    import StatusMange from './StatusMange'
    var GenerateStyle = function (opts) {
        ol.Object.call(this);
        this.json = opts.json || {};
        this.sysContext = opts.sysContext || '';
        //gis引擎图标url；
        this.gisContext = opts.gisContext || '';
        //    代理地址
        this.proxyContext = opts.proxyContext || '';
    };
    ol.inherits(GenerateStyle, ol.Object)
    GenerateStyle.prototype.init = function () {
        this.styleDef = this.json['style_def'];
        this.styleConf = this.json['style_conf'];
        this.styleDefShape = this.json['style_def_shape'];
        this.styleDefAnno = this.json['style_def_anno'];
        this.layer = this.json['layer'];
        this.layerVector = this.json['layer_vector'];
        this.styleDefStroke = this.json['style_def_stroke'];
        this.styleDefIcon = this.json['style_def_icon'];
        this.styleDefFill = this.json['style_def_fill'];
        this.resourceIcon = this.json['resource_icon'];
        this.colorLike = this.json['color_like'];
        //地图分辨率；
        this.res = null;

        //清除状态后还原原来样式时使用
        this.regnizeStyleId = null;
        this.regnizeField = null;
        this.animId = null;
        //样式缓存变量
        this.cacheStyle = {};
        //    样式状态对象
        this.styleStatus = this.json['style_status'];
        //    要素状态变更，需要根据图层id查找图层
        this.layers = {};

        //要素与图层id为状态变更切换样式时使用；
        this.feature = null;
        this.layerId = null;

        //    初始化状态管理器
        this.statusManage = new StatusMange({json: this.json});
        this.statusManage.init();
        //    监听状态管理器事件
        this.addStatusManageListener();
    };
    //清除状态后，重新生成样式使用；
    GenerateStyle.prototype.setRegnizeStyleParam = function (param) {
        if (param) {
            this.regnizeStyleId = param['styleId'];
            this.regnizeField = param['field'];
            this.animId = param['animId'];
        }
    }
    //删除原有的样式，清除原有的动画
    GenerateStyle.prototype.clearFeatureStyle = function (feature) {
        if (feature && feature instanceof ol.Feature) {
            feature.setStyle(null);
        }
    }
    //删除原有的动画效果
    GenerateStyle.prototype.clearAnimate = function (layerCode, layerWorkspace, feature) {
        if (layerCode && layerWorkspace && feature && feature instanceof ol.Feature) {
            this.dispatchEvent({
                type: 'get-layer-by-code-workspace',
                param: {code: layerCode, workspace: layerWorkspace, feature: feature}
            })
        }
    }
    //根据要素id值获取要素
    GenerateStyle.prototype.getFeatureById = function (featureId, layerCode, layerWorkspace) {
        if (featureId && layerCode && layerWorkspace) {
            this.dispatchEvent({
                type: 'get-feature-by-id',
                param: {featureId: featureId, layerCode: layerCode, layerWorkspace: layerWorkspace}
            })
        }
    }
    //发生成动画请求；
    GenerateStyle.prototype.emitGenerateAnimateRequest = function (animId, layerCode, layerWorkspace, featureStyle) {
        this.dispatchEvent({
            type: 'generate-animate-request-update',
            param: {
                feature: this.feature, styleId: animId,
                layerCode: layerCode, workspace: layerWorkspace, styles: featureStyle
            }
        })
    }

    GenerateStyle.prototype.addStatusManageListener = function () {
        var _this = this;
        this.statusManage.on('update-status-success', function (param) {
            if (param && param['param']) {
                var params = param['param'];
                for (var i in params) {
                    var item = params[i];
                    var layerCode = i.split(":")[0];       //图层编码
                    var layerWorkspace = i.split(":")[1];  //图层所在的工作空间；
                    var featureId = i.split(":")[2];
                    var status = item['statusArray'];
                    //操作类型
                    var type = item['type'];
                    var styleIdArr = []
                    //    获取要素以及图层id值
                    _this.getFeatureById(featureId, layerCode, layerWorkspace);
                    // _this.dispatchEvent({
                    //     type: 'get-feature-by-id',
                    //     param: {featureId: featureId, layerCode: layerCode, layerWorkspace: layerWorkspace}
                    // })
                    // if (type == "delete") {
                    //     if (_this.feature && _this.feature instanceof ol.Feature) {
                    //         //    置空样式；
                    //         _this.feature.setStyle(null);
                    //         //    置空动画；
                    //         _this.dispatchEvent({
                    //             type: 'empty-animate',
                    //             param: {code: layerCode, workspace: layerWorkspace, feature: _this.feature}
                    //         })
                    //     }
                    // } else
                    //清空样式
                    _this.clearFeatureStyle(_this.feature);
                    //清空动画
                    _this.clearAnimate(layerCode, layerWorkspace, _this.feature);
                    if (type == "clear" || (type == "delete" && status.length == 0)) {
                        if (_this.feature && _this.feature instanceof ol.Feature) {

                            var styles;
                            if (_this.regnizeStyleId) {
                                var style = _this.generateStyle(_this.regnizeStyleId, _this.regnizeField, _this.feature);
                                if (style && typeof style === "function") {
                                    // return style(styleId, feature, field);
                                    styles = style(_this.regnizeStyleId, _this.feature, _this.regnizeField);
                                }
                                if (styles) {
                                    _this.feature.setStyle(styles);
                                }
                                var featureId = _this.feature.get('fid');
                                if (featureId && _this.animId) {
                                    _this.emitGenerateAnimateRequest(_this.animId, layerCode, layerWorkspace, styles);
                                }
                            }

                            //    清空对象
                            if (layerCode && layerWorkspace && featureId && _this.statusManage) {
                                _this.statusManage.emptyStatusObj(layerCode, layerWorkspace, featureId)
                            }
                        }

                    } else {

                        if (status && status.length) {
                            //遍历一次，即为一次多个状态样式的组合方案
                            for (var i = 0; i < status.length; i++) {
                                var statusCode = status[i];

                                var statusCollect = _this.styleStatus[_this.layerId];
                                var styleStatusObj = statusCollect[statusCode];
                                var statusStyleId;
                                if (styleStatusObj && styleStatusObj.hasOwnProperty('styleId')) {
                                    statusStyleId = styleStatusObj['styleId'];
                                }
                                if (statusStyleId) {
                                    styleIdArr.push(statusStyleId);
                                }
                            }
                            var statusStyleConf, styleFunc, featureStyle;
                            //  状态样式组合配置方案
                            if (styleIdArr.length) {
                                statusStyleConf = _this.generateNewStyleConf(styleIdArr);
                            }

                            //    获取该图层的标注字段
                            var field = _this.getAnnoFieldByLayerId(_this.layerId);
                            //    根据状态样式组合配置方案生成样式
                            if (statusStyleConf && _this.feature) {
                                styleFunc = _this.generateStyleByConf(_this.feature, field, statusStyleConf);
                            }
                            if (styleFunc && typeof styleFunc === "function") {
                                featureStyle = styleFunc(null, _this.feature, field, statusStyleConf)
                            }
                            //把原来的样式清空


                            // _this.feature.setStyle(null);
                            // return;
                            // var featureStyle = styleFunc(null, _this.feature, field);
                            if (featureStyle) {
                                _this.feature.setStyle(featureStyle);
                            }
                            //    更新动画效果，动画效果需在其他样式更新完成了以后更新，因为可能只是添加闪烁，闪烁依赖图标样式已经生成了
                            if (statusStyleConf && statusStyleConf['animId']) {
                                // _this.dispatchEvent({type:'update-animate',param:{}})
                                _this.emitGenerateAnimateRequest(statusStyleConf['animId'], layerCode, layerWorkspace, featureStyle)
                                // _this.dispatchEvent({
                                //     type: 'generate-animate-request-update',
                                //     param: {
                                //         feature: _this.feature, styleId: statusStyleConf['animId'],
                                //         layerCode: layerCode, workspace: layerWorkspace, styles: featureStyle
                                //     }
                                // })
                            }
                        }
                    }
                }
            }
        })
    }

    //为状态变更获取要素参数
    GenerateStyle.prototype.setFeatureParamForStatusStyle = function (feature, layerId) {
        this.feature = feature;
        this.layerId = layerId;
    }
    //生成样式配置最新的组合方案；
    GenerateStyle.prototype.generateNewStyleConf = function (arr) {
        var obj = {
            "annoId": null,
            "fillId": null,
            "imageId": null,
            "strokeId": null,
            "animId": null
        }
        if (arr && arr.length) {
            for (var i = 0; i < arr.length; i++) {
                var styleId = arr[i];
                var styleParam = this.styleConf[styleId];
                if (styleParam && JSON.stringify(styleParam) != "{}") {
                    var annoId = styleParam['annoId'];
                    if (annoId) {
                        obj['annoId'] = annoId;
                    }
                    var fillId = styleParam['fillId'];
                    if (fillId) {
                        obj['fillId'] = fillId;
                    }
                    var imageId = styleParam['imageId'];
                    if (imageId) {
                        obj['imageId'] = imageId;
                    }
                    var strokeId = styleParam['strokeId'];
                    if (strokeId) {
                        obj['strokeId'] = strokeId;
                    }
                    var animId = styleParam['animId'];
                    if (animId) {
                        obj['animId'] = animId;
                    }

                }
            }
        }
        return obj;
    }
    //根据状态样式组合配置方案生成样式
    GenerateStyle.prototype.generateStyleByConf = function (feature, field, obj) {
        //调用生成样式的方法
        var styleFunc = this.stylesFunc(null, feature, field, obj);
        return styleFunc;

    }
    //获取地图参数
    GenerateStyle.prototype.setMapViewOptions = function (param) {
        if (param && param['res']) {
            this.res = param['res'];
        }
    }
    GenerateStyle.prototype.generateStyleElement = function (styleId, otherConf, feature) {
        var imageId, strokeId, fillId, animateId;
        var obj = {};
        if (styleId) {
            if (this.styleConf) {
                if (styleId) {
                    obj['item'] = this.styleConf[styleId];
                } else {
                    var flag = false;
                    for (var i in this.styleConf) {
                        if (!flag) {
                            obj['item'] = this.styleConf[i];
                            flag = true;
                        }
                    }
                }
                if (obj['item'] && obj['item']['imageId']) {
                    imageId = obj['item']['imageId'];
                }
                if (obj['item'] && obj['item']['strokeId']) {
                    strokeId = obj['item']['strokeId'];
                }
                if (obj['item'] && obj['item']['fillId']) {
                    fillId = obj['item']['fillId'];
                }
                // if (obj['item'] && obj['item']['animateId']) {
                //     animateId = obj['item']['animateId'];
                // }
            }
        } else {
            if (otherConf && otherConf['imageId']) {
                imageId = otherConf['imageId']
            }
            if (otherConf && otherConf['strokeId']) {
                strokeId = otherConf['strokeId']
            }
            if (otherConf && otherConf['fillId']) {
                fillId = otherConf['fillId']
            }
            if (otherConf && otherConf['animId']) {
                animateId = otherConf['animId'];
            }
        }
        if (imageId) {
            obj['imageStyle'] = this.getDetailStyleIdAndType(imageId)
        }
        if (strokeId) {
            obj['strokeStyle'] = this.getDetailStyleIdAndType(strokeId, feature);
        }
        if (fillId) {
            obj['fillStyle'] = this.getDetailStyleIdAndType(fillId, feature)
        }
        //动画效果
        // if (animateId) {
        //     obj['animateStyle'] = this.getDetailStyleIdAndType(animateId);
        // }
        return obj;
    }
    //在cacheStyle中查找要素样式
    GenerateStyle.prototype.findStyleInCacheStyle = function (styleId) {
        if (styleId && this.cacheStyle) {
            if (this.cacheStyle.hasOwnProperty(styleId)) {
                return this.cacheStyle[styleId];
            } else {
                return null;
            }
        }
    }
    //生成矢量要素样式结果为ol.style.Style;
    GenerateStyle.prototype.generateStyle = function (styleId, field, feature) {

        //根据styleId查找样式
        var styles = this.findStyleInCacheStyle(styleId);
        if (!styles) {
            styles = this.stylesFunc(styleId, feature, field);
            this.storeStyle(styleId, styles);
        }
        return styles;
    }
    GenerateStyle.prototype.stylesFunc = function (styleId, feature, field, otherConf) {
        var _this = this;
        return function (styleId, feature, field, otherConf) {
            var annoId, element;
            //其他拼成的
            if (otherConf) {
                annoId = otherConf['annoId'] || '';
                //添加feature，为渐变色单位为比率时提供计算参数；
                element = _this.generateStyleElement(null, otherConf, feature)
            } else if (styleId) {
                //添加feature，为渐变色单位为比率时提供计算参数；
                element = _this.generateStyleElement(styleId, null, feature);
                annoId = element['item']['annoId'] || ''
            }
            // if (element && element['item']) {
            if (element) {
                return new ol.style.Style({
                    fill: element['fillStyle'] || undefined,
                    image: element['imageStyle'] || undefined,
                    stroke: element['strokeStyle'] || undefined,
                    text: _this.creatTextStyle(feature, field, annoId)
                });
            } else {
                return null;
            }
        }
    }
    //缓存样式
    GenerateStyle.prototype.storeStyle = function (styleId, style) {
        if (style && styleId) {
            this.cacheStyle[styleId] = style;
        }
    }
    GenerateStyle.prototype.creatTextStyle = function (feature, field, annoId) {
        if (annoId) {
            // var textStyle = this.getDetailStyleIdAndType(annoId, textValue);
            var textStyle = this.getDetailStyleIdAndType(annoId, feature, field);
            return textStyle;
        } else {
            return null;
        }
    }
    GenerateStyle.prototype.getDetailStyleIdAndType = function (styleId, feature, field) {
        if (this.styleDef) {
            var item = this.styleDef[styleId];
            if (item) {
                var styleType = item.type;
                var detailId = item.infoId;
                return this.getStyleParams(detailId, styleType, feature, field);
                // return this.getStyleParams(detailId, styleType, text);
            }
        }
    }
    GenerateStyle.prototype.getStyleParams = function (styleId, type, feature, field) {
        switch (type) {
            case "style_def_fill": {
                return this.getFillParam(styleId, feature);
            }
            case "style_def_stroke": {
                return this.getStrokeParam(styleId, feature);
            }
            case "style_def_shape": {
                return this.getShapeParam(styleId, feature);
            }
            case "style_def_icon": {
                return this.getIconParam(styleId);
            }
            case "style_def_anno": {
                return this.getAnnoParam(styleId, feature, field);
                // return this.getAnnoParam(styleId, text);
            }
            default: {
                break;
            }
            //    添加动画效果
            // case "style_def_animate": {
            //     this.dispatchEvent({type: 'generate-animate-request', param: {feature: feature, styleId: styleId}})
            // }
        }
    }
    GenerateStyle.prototype.getFillParam = function (styleId, feature) {
        if (this.styleDefFill) {
            var item = this.styleDefFill[styleId];
            var param;
            if (item) {
                if (item['colorLikeId']) {
                    //返回渐变对象；
                    var gradient = this.generateGradient(item['colorLikeId'], feature);
                    return new ol.style.Fill({
                        color: gradient
                    })
                } else {
                    param = {
                        color: this.styleDefFill[styleId].color || ''
                    }
                    return this.generateFillStyle(param);
                }
            }
        }
    }
    //生成渐变对象
    GenerateStyle.prototype.generateGradient = function (colorId, feature) {
        //填充的类型
        if (colorId && this.colorLike && this.colorLike[colorId]) {
            var item = this.colorLike[colorId];
            var type = item['type'];
            var colorLike = item['colorLike'];
            // var fillType = this.colorConf[colorId]['type'];
            // var infoId = this.colorConf['infoId'];
            var cnv = document.createElement('canvas');
            var ctx = cnv.getContext('2d');
            var w, h, r;
            if (feature && feature instanceof ol.Feature) {
                var extent = feature.getGeometry().getExtent();
                // w = ol.extent.getWidth(extent);
                w = ol.extent.getWidth(extent) / this.res;
                h = ol.extent.getHeight(extent) / this.res;
                // h = ol.extent.getHeight(extent);
                r = w;
            }
            // if(this.isRealNum(w)&& this.isRealNum(h)){
            //     cnv.width = w;
            //     cnv.height = h;
            // }
            switch (type) {
                //线型渐变色填充
                case "gradient_linear": {
                    return this.generateLinearGradient(colorLike, ctx, w, h);
                }
                //径向渐变色填充
                case "gradient_radial": {
                    return this.generateRadialGradient(colorLike, ctx, w, h, r);
                }
                //点图形平铺填充
                case "pattern_point": {
                    return this.generatePointFill(colorLike, cnv, w, h);
                }
                case "pattern_line" : {
                    return this.generatePatternLine(colorLike, cnv, w, h);
                }
            }
        }
    }
    //为渐变色对象添加色阶
    GenerateStyle.prototype.addColorStop = function (colorLike, gradient) {
        if (colorLike && colorLike['value']) {
            var value = colorLike['value'];
            var valueObj = JSON.parse(value);
            if (valueObj && valueObj['colorStop']) {
                var colorStop = valueObj['colorStop'];
                // if(value && value['color'])
                if (colorStop && colorStop.length) {
                    for (var i = 0; i < colorStop.length; i++) {
                        var ele = colorStop[i];
                        var stop = Number(ele['stop']);
                        var color = ele['color'];
                        if (color && gradient) {
                            gradient.addColorStop(stop, color);
                        }
                    }
                }
            }
        }
    }
    //判断是否为数字
    GenerateStyle.prototype.isRealNum = function (val) {
        // isNaN()函数 把空串 空格 以及NUll 按照0来处理 所以先去除
        if (val === "" || val == null) {
            return false;
        }
        if (!isNaN(val)) {
            return true;
        } else {
            return false;
        }
    }
    //生成线型渐变色填充对象；
    GenerateStyle.prototype.generateLinearGradient = function (colorLike, ctx, w, h) {
        if (colorLike && colorLike['value']) {
            var value = JSON.parse(colorLike['value']);
            // var colorStop = value['colorStop'];
            var x0Unit = value['x0Unit'];
            var x0 = value['x0'];
            if (x0Unit == "fraction" && this.isRealNum(x0) && this.isRealNum(w)) {
                x0 *= w;
            }
            var y0Unit = value['y0Unit'];
            var y0 = value['y0']
            if (y0Unit == "fraction" && this.isRealNum(y0) && this.isRealNum(h)) {
                y0 *= h;
            }
            var x1Unit = value['x1Unit'];
            var x1 = value['x1'];
            if (x1Unit == "fraction" && this.isRealNum(x1) && this.isRealNum(w)) {
                x1 *= w;
            }
            var y1 = value['y1'];
            var y1Unit = value['y1Unit'];
            if (y1Unit == "fraction" && this.isRealNum(y1) && this.isRealNum(h)) {
                y1 *= h;
            }
            var gradient;
            if (this.isRealNum(x0) && this.isRealNum(y0) && this.isRealNum(x1) && this.isRealNum(y1)) {
                gradient = ctx.createLinearGradient(x0, y0, x1, y1);
            }
            //为渐变对象添加色阶；
            if (gradient && colorLike) {
                this.addColorStop(colorLike, gradient);
            }
            return gradient;
            // return new ol.style.Style({
            //     fill: new ol.style.Fill({
            //         color: gradient
            //     })
            // });
            // return new ol.style.Fill({
            //     color: gradient
            // })
        }
    }
    //生成径向渐变色填充对象；
    GenerateStyle.prototype.generateRadialGradient = function (colorLike, ctx, w, h, r) {
        //判断圆形坐标单位以及半径单位
        if (colorLike && colorLike['value']) {
            var value = JSON.parse(colorLike['value']);
            var x0, x1, y0, y1, r0, r1, x0Unit, x1Unit, y0Unit, y1Unit, r0Unit, r1Unit;
            x0Unit = value['x0Unit'];
            if (x0Unit && x0Unit == "fraction" && this.isRealNum(w)) {
                x0 = Number(value['x0']);
                if (this.isRealNum(x0)) {
                    x0 *= w;
                }
            }
            x1Unit = value['x1Unit'];
            if (x1Unit && x1Unit == "fraction" && this.isRealNum(w)) {
                x1 = Number(value['x1']);
                if (this.isRealNum(x1)) {
                    x1 *= w;
                }
            }
            y0Unit = value['y0Unit'];
            if (y0Unit && y0Unit == "fraction" && this.isRealNum(h)) {
                y0 = Number(value['y0']);
                if (this.isRealNum(y0)) {
                    y0 *= h;
                }
            }
            y1Unit = value['y1Unit'];
            if (y1Unit && y1Unit == "fraction" && this.isRealNum(h)) {
                y1 = Number(value['y1']);
                if (this.isRealNum(y1)) {
                    y1 *= h;
                }
            }
            r0Unit = value['r0Unit'];
            if (r0Unit && y0Unit == "fraction" && this.isRealNum(h)) {
                r0 = Number(value['r0']);
                if (this.isRealNum(r0)) {
                    r0 *= h;
                }
            }
            r1Unit = value['r1Unit'];
            if (r1Unit && r1Unit == "fraction" && this.isRealNum(h)) {
                r1 = Number(value['r1']);
                if (this.isRealNum(r1)) {
                    r1 *= h;
                }
            }
            var gradient;
            if (this.isRealNum(x0) && this.isRealNum(y0) && this.isRealNum(x1) && this.isRealNum(y1)) {
                gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
            }
            if (gradient && colorLike) {
                this.addColorStop(colorLike, gradient);
            }
            return gradient;
            // return new ol.style.Style({
            //     fill: new ol.style.Fill({
            //         color: gradient
            //     })
            // });
            // return new ol.style.Fill({
            //     color: gradient
            // })
        }

        // var gradient = ctx.createRadialGradient(w / 2, h / 2,
        //     r * 0.1, w / 2, h / 2, r);
        //添加色阶
        // this.addColorStop(colorLike, gradient);
        // return new ol.style.Style({
        //     fill: new ol.style.Fill({
        //         color: gradient
        //     })
        // });
    }
    //生成点图形平铺填充对象；
    GenerateStyle.prototype.generatePointFill = function (colorLike, canvas, w, h) {
        var context = canvas.getContext('2d');
        if (colorLike && colorLike['value']) {
            var colorValue = JSON.parse(colorLike['value']);
            if (colorValue['canvasWidth']) {
                canvas.width = colorValue['canvasWidth'];
                if (colorValue['canvasWidthUnit'] == "fraction"
                    && this.isRealNum(canvas.width) && this.isRealNum(w)) {
                    canvas.width *= w;
                }
            }
            if (colorValue['canvasHeight']) {
                canvas.height = colorValue['canvasHeight'];
                if (colorValue['canvasHeightUnit'] == "fraction"
                    && this.isRealNum(canvas.height) && this.isRealNum(h)) {
                    canvas.height *= h;
                }
            }
            if (colorValue['canvasBackgroundColor']) {
                context.fillStyle = colorValue['canvasBackgroundColor'];
            }
            if (canvas.width >= 0 && canvas.height >= 0) {
                context.fillRect(0, 0, canvas.width, canvas.height);
            }
            context.fillStyle = colorValue['pointColor'];
            context.beginPath();
            var arcX = colorValue['arcX'];
            if (colorValue['arcXUnit'] && colorValue['arcXUnit'] == "fraction"
                && this.isRealNum(arcX) && this.isRealNum(w)) {
                arcX *= w;
            }
            var arcY = colorValue['arcY'];
            if (colorValue['arcYUnit'] && colorValue['arcYUnit'] == "fraction"
                && this.isRealNum(arcY) && this.isRealNum(h)) {
                arcY *= h;
            }
            var arcR = colorValue['arcR'];
            if (colorValue['arcRUnit'] && colorValue['arcRUnit'] == "fraction"
                && this.isRealNum(arcR) && this.isRealNum(h)) {
                arcR *= h;
            }
            var startAngle = colorValue['arcStartAngle'];
            var endAngle = colorValue['arcEndAngle'];
            var acrAntiClockwise = colorValue['acrAntiClockwise'];
            if (this.isRealNum(arcX) && this.isRealNum(arcY) && this.isRealNum(arcR)
                && this.isRealNum(startAngle) && this.isRealNum(endAngle)) {
                context.arc(arcX, arcY, arcR, startAngle, endAngle, acrAntiClockwise);
                context.fill();
            }
            var pattern = context.createPattern(canvas, 'repeat');
            return pattern;
        }
    }
    //线型填充
    //页面传过的角度值为度数非弧度；
    GenerateStyle.prototype.generatePatternLine = function (colorLike, canvas, w, h) {
        var context = canvas.getContext('2d');
        if (colorLike && colorLike['value']) {
            var colorValue = JSON.parse(colorLike['value']);
            if (colorValue['canvasWidth']) {
                canvas.width = colorValue['canvasWidth'];
                if (colorValue['canvasWidthUnit'] == "fraction"
                    && this.isRealNum(canvas.width) && this.isRealNum(w)) {
                    canvas.width *= w;
                }
            }
            if (colorValue['canvasHeight']) {
                canvas.height = colorValue['canvasHeight'];
                if (colorValue['canvasHeightUnit'] == "fraction"
                    && this.isRealNum(canvas.height) && this.isRealNum(h)) {
                    canvas.height *= h;
                }
            }
            if (colorValue['canvasBackgroundColor']) {
                context.fillStyle = colorValue['canvasBackgroundColor'];
            }
            //如果canvas有宽度或高度为0，渲染效果无效；
            if (canvas.width >= 0 && canvas.height >= 0 && context) {
                context.fillRect(0, 0, canvas.width, canvas.height);
                context.beginPath();
                context.fill();
                context.lineWidth = colorValue['lineWidth'];
                context.strokeStyle = colorValue['lineColor'];
                var distance = (colorValue['lineDistance'] && colorValue['lineDistance'] >= 10) ? colorValue['lineDistance'] : 10;
                var angle = colorValue['angle'];
                var lineStartPointX = colorValue['lineStartPointX'];
                var lineStartPointY = colorValue['lineStartPointY'];
                if (this.isRealNum(distance) && this.isRealNum(lineStartPointX) && this.isRealNum(lineStartPointY)) {
                    var lineEndPointX, lineEndPointY;
                    var deltaX, deltaY;
                    // if (angle == 0 || angle == Math.PI || angle == -Math.PI ||
                    //     angle == Math.PI * 2 || angle == -2 * Math.PI) {
                    if (angle == 0) {
                        //水平线,只往下填充；
                        deltaY = distance;
                        for (var i = 0; i < (canvas.height - lineStartPointY) / deltaY; i++) {
                            context.moveTo(lineStartPointX, lineStartPointY + deltaY * i);
                            context.lineTo(canvas.width, lineStartPointY + deltaY * i);
                        }
                    } else if (angle == 90) {
                        //    垂直线，之往右填充,不往左；
                        deltaX = distance;
                        for (var i = 0; i < (canvas.width - lineStartPointX) / distance; i++) {
                            context.moveTo(lineStartPointX + deltaX * i, lineStartPointY);
                            context.lineTo(lineStartPointX + deltaX * i, canvas.height);
                        }
                    } else if (angle == -45) {
                        lineEndPointX = canvas.height - lineStartPointY / Math.atan(angle);
                        lineEndPointY = canvas.height;
                        for (var i = 0; i < canvas.width / distance; i++) {
                            context.moveTo(lineStartPointX + i * distance, lineStartPointY);
                            context.lineTo(lineEndPointX + i * distance, lineEndPointY);
                        }
                    } else if (angle == 45) {
                        //只往上填充，不往下填充，且起点要位于canvas内；
                        if (lineStartPointY > 0) {
                            lineEndPointX = lineStartPointX + lineStartPointY / Math.atan(angle);
                            lineEndPointY = 0;
                            for (var i = 0; i < canvas.width / distance; i++) {
                                context.moveTo(lineStartPointX + i * distance, lineStartPointY);
                                context.lineTo(lineEndPointX + i * distance, lineEndPointY);
                            }
                        }
                    } else {
                        //    斜线,填充方向为由左上角点开始往右下方填充,终点的y的值均为0；
                        lineEndPointX = Math.atan(angle) * lineStartPointY;
                        lineEndPointY = 0;
                        for (var i = 0; i < canvas.width / distance; i++) {
                            context.moveTo(lineStartPointX + i * distance, lineStartPointY);
                            context.lineTo(lineEndPointX + i * distance, lineEndPointY);
                        }
                    }
                    context.stroke();
                    // context.fillStyle
                    var pattern = context.createPattern(canvas, 'repeat');
                    // return new ol.style.Style({
                    //     fill: new ol.style.Fill({
                    //         color: pattern
                    //     })
                    // });
                    return pattern;
                    // return new ol.style.Fill({color: pattern});
                }
            }
        }
    }
    GenerateStyle.prototype.getStrokeParam = function (styleId, feature) {
        if (this.styleDefStroke) {
            var item = this.styleDefStroke[styleId];
            var dash, color;
            color = item.color;
            if (item['dash'] && item['dash'].length > 0) {
                dash = item['dash'].split(',');
            }
            if (item && item['colorLikeId']) {
                color = this.generateGradient(item['colorLikeId'], feature);
            }
            var param = {
                // color: item.color || '',
                color: color,
                lineCap: item.cap || 'round',
                // lineJoin: item.lineJoin || 'round',
                lineJoin: item.join || 'round',
                lineDash: dash || undefined,
                lineDashOffset: item.dashOffset || 0,
                miterLimit: item.miterLimit || 10,
                width: item.width || 1,
            }
            return this.generateStrokeStyle(param);
        }
    }
    GenerateStyle.prototype.getShapeParam = function (styleId, feature) {
        if (this.styleDefShape) {
            var item = this.styleDefShape[styleId];
            if (item.points === -1 || item.points === "-1") {
                item.points = Infinity;
            }
            var param = {
                feature: feature,
                fillId: item.fillId || '',
                points: item.points || Infinity,
                radius: item.radius || 14,
                radius2: item.radius2 || 0,
                angle: item.angle || 0,
                strokeId: item.strokeId || '',
                rotateWithView: item.rotateWithView || false,
                rotation: item.rotation || 0
            }
            return this.generateRegularShapeStyle(param);
        }
    }
    GenerateStyle.prototype.getIconParam = function (styleId) {
        if (this.styleDefIcon) {
            var item = this.styleDefIcon[styleId];
            var url = item.src;
            //添加图片库的地址
            if (item && item.hasOwnProperty('resourceType') && item.hasOwnProperty('resourceId')) {
                var resouceType = item['resourceType'];
                var resourceId = item['resourceId'];
                if (resourceId && resouceType && this.resourceIcon && resouceType == "resource_icon") {
                    var elem = this.resourceIcon[resourceId];
                    if (elem && elem.hasOwnProperty('path') && elem['path']) {
                        url = this.gisContext + elem['path'];
                    }
                }
            }
            var crossOrign;
            if (item.crossOrigin) {
                crossOrign = "Anonymous";
            }
            // var src = this.changeUrlforContext(item.src);
            url = this.changeUrlforContext(url);
            var attr = this.isNumber(item['opacity']);
            var param = {
                anchor: [item.anchorX, item.anchorY] || [0.5, 0.5],
                anchorXUnits: item.anchorXUnits || 'fraction',
                anchorYUnits: item.anchorYUnits || 'fraction',
                color: (!item.color || item.color === '' || item.color == 'undefined') ? undefined : item.color,
                crossOrigin: crossOrign,
                offset: [item.offsetX, item.offsetY] || [0, 0],
                // opacity: item.opacity || 1,
                opacity: attr['flag'] ? attr['num'] : 1,
                scale: item.scale || 1,
                rotation: item.rotation || 0,
                rotateWithView: item.rotate || false,
                size: [item.iconWidth, item.iconHeight] || [10, 10],
                // imgSize: item.imgSize || [10, 10],
                // src: src
                src: url
                // img: item.img || null,
            }
            return this.generateIconStyle(param);
        }
    }
    GenerateStyle.prototype.getAnnoParam = function (styleId, feature, field) {
        if (this.styleDefAnno) {
            var item = this.styleDefAnno[styleId];
            var text = "";
            if (feature.get(field) != undefined) {
                text = feature.get(field).toString();
            }
            var param = {
                font: item.font || '10px sans-serif',
                offsetX: item.offsetX || 0,
                offsetY: item.offsetY || 0,
                scale: item.scale || 1,
                rotateWithView: item.rotate || false,
                rotation: item.rotation || 0,
                textAlign: item.align || 'start',
                textBaseline: item.baseline || 'alphabetic',
                fillId: item.fillId || '',
                strokeId: item.strokeId || '',
                text: text || '',
                backgroundFillId: item.backgroundFillId || "",
                backgroundStrokeId: item.backgroundStrokeId || '',
                padding: item.padding || [0, 0, 0, 0]
                // text: feature ? feature.get(field) : ''
            }
            return this.generateAnnoStyle(param);
        }
    }
    GenerateStyle.prototype.generateAnnoStyle = function (param) {
        var fillStyle, strokeStyle, backgroundFill, backgroundStroke, padding;
        if (param.fillId) {
            fillStyle = this.getDetailStyleIdAndType(param.fillId, param.text);
        }
        if (param.strokeId) {
            strokeStyle = this.getDetailStyleIdAndType(param.strokeId, param.text);
        }
        //文字背景填充
        if (param.backgroundFillId) {
            backgroundFill = this.getDetailStyleIdAndType(param.backgroundFillId, param.text);
        }
        //文字线型
        if (param.backgroundStrokeId) {
            backgroundStroke = this.getDetailStyleIdAndType(param.backgroundStrokeId, param.text)
        }
        if (param.padding) {
            var arr = param.padding.split(",");
            padding = JSON.parse('[' + arr + ']')
        } else {
            padding = [0, 0, 0, 0];
        }
        var annoStyle = new ol.style.Text({
            font: param.font,
            offsetX: param.offsetX,
            offsetY: param.offsetY,
            scale: param.scale,
            rotateWithView: param.rotateWithView,
            rotation: param.rotation,
            text: param.text, // 这个是哪个字段
            textAlign: param.textAlign,
            textBaseline: param.textBaseline,
            fill: fillStyle || undefined,
            stroke: strokeStyle || '',
            backgroundFill: backgroundFill || undefined,
            backgroundStroke: backgroundStroke || undefined,
            padding: padding
        })
        return annoStyle;
    }
    GenerateStyle.prototype.generateIconStyle = function (param) {
        var iconStyle = new ol.style.Icon(param)
        return iconStyle;
    }
    GenerateStyle.prototype.generateFillStyle = function (param) {
        var fillStyle = new ol.style.Fill(param)
        return fillStyle;
    }
    GenerateStyle.prototype.generateStrokeStyle = function (param) {
        var strokeStyle = new ol.style.Stroke(param)
        return strokeStyle;
    }
    GenerateStyle.prototype.generateRegularShapeStyle = function (param) {
        var fillStyle = null, strokeStyle = null;
        if (param.fillId) {
            fillStyle = this.getDetailStyleIdAndType(param.fillId, param.feature);
        }
        if (param.strokeId) {
            strokeStyle = this.getDetailStyleIdAndType(param.strokeId, param.feature);
        }
        var regularShapeStyle = new ol.style.RegularShape({
            fill: fillStyle,
            stroke: strokeStyle,
            points: param.points, // 必须项
            // radius : param.radius || 14,
            radius: param.radius,
            radius2: param.radius2,
            angle: param.angle,
            // snapToPixel : param.snapToPixel || true,
            rotation: param.rotation,
            rotateWithView: param.rotateWithView
            // atlasManager : param.atlasManager
        })
        return regularShapeStyle;
    }
    //判断某个字符串是否包含子字符串的方法
    GenerateStyle.prototype.isContains = function (str, subStr) {
        return new RegExp(subStr).test(str);
    }
    GenerateStyle.prototype.changeUrlforContext = function (url) {
        if (url) {
            var gisContext = this.isContains(url, "gisContext");
            var sysContext = this.isContains(url, "sysContext");
            var proxyContext = this.isContains(url, "proxyContext");
            var ctxRegEx = /\{sysContext\}/g;
            var gisRegEx = /\{gisContext\}/g;
            var proxyRegEx = /\{proxyContext\}/g;
            if (gisContext && this.gisContext) {
                url = url.replace(gisRegEx, this.gisContext);
            } else if (sysContext && this.sysContext) {
                url = url.replace(ctxRegEx, this.sysContext);
            } else if (proxyContext && this.proxyContext) {
                url = url.replace(proxyRegEx, this.proxyContext);
            }
        }
        return url;
    }
    //更新要素状态
    GenerateStyle.prototype.updateStyle = function (param) {
        //status是否为空，如果为空，则回到原来的状态，如果不为空，则更新当前状态；
        var styleId;
        var feature = param['feature'] || '';
        var layer = param['layer'] || '';
        var status = param['statusCode'] || ''
        if (layer && layer instanceof ol.layer.Vector) {

            var layerId = layer.get('id');
            var field = this.getAnnoFieldByLayerId(layerId);
            if (status) {
                if (this.styleStatus && JSON.stringify(this.styleStatus) != "{}") {
                    if (feature && feature instanceof ol.Feature && status) {
                        // var id = feature.get('id');

                        var styleInfo = this.styleStatus[layerId];
                        if (styleInfo && styleInfo.hasOwnProperty(status)) {
                            styleId = styleInfo[status]['styleId'];
                        }
                    }
                }
            } else {
                if (this.layer) {
                    var info = this.layer[layerId];
                    if (info) {
                        var infoId = info['infoId'];
                        if (infoId && this.layerVector) {
                            var option = this.layerVector[infoId];
                            styleId = option['styleId'];
                        }
                    }
                }
                //    根据图层id查找图层为图层管理器的内容
                // if (JSON.stringify(this.layerVector) != "{}") {
                //     var option = this.layerVector[layerId];
                //     if (option && option.hasOwnProperty("styleId")) {
                //         styleId = option['styleId'];
                //     }
                // }
            }
            if (this.cacheStyle && styleId) {
                var style = this.cacheStyle[styleId];
                if (!style) {
                    style = this.generateStyle(styleId, field, feature)
                }
                var featureStyle = style(styleId, feature, field);
                if (featureStyle) {
                    feature.setStyle(featureStyle);
                }
            }
        }
    }
    //根据styleId获取标注字段
    GenerateStyle.prototype.getAnnoFieldByLayerId = function (layerId) {
        var field;
        if (this.layerVector && layerId && this.layer) {
            var info = this.layer[layerId];
            if (info) {
                var infoId = info['infoId'];
                if (infoId) {
                    var option = this.layerVector[infoId];
                    if (option) {
                        field = option['annoField'];
                    }
                }
            }
            return field;
        }
    }
    //判断是否为数字；
    GenerateStyle.prototype.isNumber = function (num) {
        if (parseFloat(num).toString() === "NaN") {
            return '';
        } else {
            var obj = {};
            obj['num'] = Number(parseFloat(num).toString());
            obj['flag'] = true;
            return obj;
        }
    }
    //根据后端获取数据恢复地图要素状态样式
    GenerateStyle.prototype.updateStatus = function (json) {
        if (json && json.data) {
            //1. 解析参数恢复地图要素状态样式
            var data = json.data;
            if (data.length && this.statusManage) {
                this.statusManage.updateStatus(data);
            }
            //2. 同时更新地图要素状态集合对象
            // if (this.statusManage) {
            //     this.updataFeatureStatusObj(data);
            // }
        }
    }
    //地图范围变更，恢复地图要素状态接口
    GenerateStyle.prototype.recoveryFeatureByObj = function () {
        if (this.statusManage) {
            this.statusManage.recoveryFeatureByObj();
        }
    }
    // return GenerateStyle;
    export default GenerateStyle
// })
