// define('gais/map/Animate', ['ol'], function (ol) {
import ol from './ol'
        var Animate = function (opts) {
            ol.Object.call(this);
            this.json = opts.json || {};
        }
        ol.inherits(Animate, ol.Object);
        Animate.prototype.init = function () {
            this.start = new Date().getTime();
            this.baseTime = this.start;
            this.duration = 2500;
            this.styleDef = this.json['style_def'];
            this.styleAnimWave = this.json['style_anim_wave'];
            this.styleAnimBlink = this.json['style_anim_blink'];
            this.styleDefFill = this.json['style_def_fill'];
            this.colorLike = this.json['color_like'];
        }
        //生成动画效果
        // Animate.prototype.generateAnimate = function (event, param, imageStyle, key, style,time) {
        Animate.prototype.generateAnimate = function (event, param, key) {
            //    解析动画效果参数
            //    判断动画效果类型
            var params = param['param'];
            var style = params['style'];
            var paramKey = params['paramKey'];

            var obj = params['param'][paramKey];
            // var type = params['type'];
            var feature = obj['feature'];

            var id = feature.get('id');
            var styleId = params['styleId'];
            var item = this.getAnimParam(styleId);
            if (item && item['type']) {
                var type = item['type'];
                //闪烁
                if (type == "style_anim_blink") {
                    // this.generateBlink(event, feature, item, imageStyle, key, style,time);
                    this.generateBlink(event, obj, item, key, style);
                } else if (type == "style_anim_wave") {
                    //    扩散
                    // this.generateWave(event, feature, item, key);
                    this.generateWave(event, obj, item, key, style);
                }
            }
        }
        //图标闪烁
        // Animate.prototype.generateBlink = function (event, feature, item, imageStyle, key, style,time) {
        Animate.prototype.generateBlink = function (event, obj, item, key, style) {
            // alert('0')
            // style.setImage(undefined);
            // feature.setStyle(style);
            // return;
            var feature = obj['feature'];
            var id = feature.get('id');
            var startTime = obj['startTime'];
            var baseTime = obj['baseTime'];
            // var startTime = time;
            // var startTime = feature.get('startTime');
            // var baseTime = feature.get('baseTime');
            // var vectorContext = event.vectorContext;
            // var geom = feature.getGeometry().clone();
            var frameState = event.frameState;
            // console.log("每真哒时间："+frameState.time)
            // var elapsed = frameState.time - this.start;
            var tt = frameState.time;
            var elapsed = frameState.time - startTime;
            // console.log("动画执行了："+elapsed)
            //该帧距开始动画的时间，计算动画当前持续时间
            var deltaTime = frameState.time - baseTime;
            // var deltaTime = frameState.time - this.baseTime;
            //持续时间,单位为秒；
            var duration = item['duration'];
            if (item['duration'] && this.isRealNum(duration)) {
                duration *= 1000;
            }
            // var duration = item['duration'] * 60;
            //一次动画执行周期
            var period = item['period'];
            // var
            if (duration > 0) {
                if (deltaTime >= duration) {
                    // this.dispatchEvent({type: "blink-end", param: {feature: feature, key: key, paramKey: obj['key']}});
                    this.dispatchEvent({type: "animate-end", param: {feature: feature, key: key, paramKey: obj['key']}});
                    // feature.getStyle().setImage(imageStyle);
                    style.getImage().setOpacity(1);
                    // this.baseTime = new Date().getTime();
                    // this.start = new Date().getTime();
                    // return;
                }
            }
            if (elapsed >= period) {

                if (obj['flushFlag']) {
                    style.getImage().setOpacity(1);
                    obj['flushFlag'] = false;
                    // style.setImage(undefined);
                    // feature.set('iconFlag',false);
                } else {
                    style.getImage().setOpacity(0);
                    obj['flushFlag'] = true;
                    // style.setImage(imageStyle);
                    // feature.set('iconFlag',true)
                }
                //   if (flag) {
                //       style.setImage(undefined);
                //       flag = false;
                //   } else {
                //       style.setImage(imageStyle);
                //       flag = true;
                //   }
                //重置起始时间
                // this.start = new Date().getTime();
                // startTime = new Date().getTime();
                var time = new Date().getTime();
                obj['startTime'] = time;

                //达到一个周期通知上级修改；
                this.dispatchEvent({type: 'update-animate-param', param: obj})
                // feature.set('startTime',time)
                if (style && style instanceof ol.style.Style) {
                    feature.setStyle(style);
                }
            }
            this.dispatchEvent({type: 'render-map', param: {msg: "blink need map render"}})

        }
        //判断是否为数字
        Animate.prototype.isRealNum = function (val) {
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
        //计算扩散半径
        Animate.prototype.caculateWaveRadius = function (type, ratio, radiusEnd, radiusStart) {
            var radius;
            if (this.isRealNum(radiusStart) && this.isRealNum(radiusEnd) && this.isRealNum(ratio)) {
                switch (type) {
                    case "easeIn": {
                        radius = ol.easing.easeIn(ratio) * (radiusEnd - radiusStart) + radiusStart;
                        break
                    }
                    case "easeOut": {
                        radius = ol.easing.easeOut(ratio) * (radiusEnd - radiusStart) + radiusStart;
                        break
                    }
                    case "inAndOut": {
                        radius = ol.easing.inAndOut(ratio) * (radiusEnd - radiusStart) + radiusStart;
                        break
                    }
                    case "linear": {
                        radius = ol.easing.linear(ratio) * (radiusEnd - radiusStart) + radiusStart;
                        break
                    }
                    case "upAndDown": {
                        radius = ol.easing.upAndDown(ratio) * (radiusEnd - radiusStart) + radiusStart;
                        break
                    }
                }
            }
            return radius;
        }
        //扩散
        // Animate.prototype.generateWave = function (event, feature, item, key) {
        Animate.prototype.generateWave = function (event, obj, item, key, style) {

            //event, obj, item, key, style
            //持续的时间怎么计算
            var vectorContext = event.vectorContext;
            var frameState = event.frameState;
            var startTime = obj['startTime'];
            var baseTime = obj['baseTime'];
            var elapsed = frameState.time - startTime;
            // var elapsed = frameState.time - this.start;
            // var deltaTime = frameState.time - this.baseTime;
            var deltaTime = frameState.time - baseTime;
            if (elapsed >= 0) {
                var feature = obj['feature']
                var geom = feature.getGeometry().clone();
                //扩散自带参数,持续时间；
                var duration = item['duration'];
                if (duration) {
                    duration *= 1000;
                }
                //结束的扩散半径
                var radiusEnd = item['radiusEnd'];
                //开始的扩散半径　　　
                var radiusStart = item['radiusStart'];
                //动画节奏
                var easing = item['easing'];
                //开始扩散半径单位；
                var radiusStartUnit = item['radiusStartUnit'];
                //结束扩散半径单位；
                var radiusEndUnit = item['radiusEndUnit'];
                //动画周期
                var period = item['period'];
                //计算比率
                // var elapsedRatio = elapsed / duration;
                var elapsedRatio;
                if (period > 0) {
                    elapsedRatio = elapsed / period;
                }
                // var elapsedRatio = elapsed / duration;

                //判断动画持续时间；
                if (duration != 0) {
                    if (deltaTime >= duration) {
                        // this.dispatchEvent({type: "wave-end", param: {key: key, feature: feature,paramKey:obj['key']}});
                        this.dispatchEvent({
                            type: "animate-end",
                            param: {key: key, feature: feature, paramKey: obj['key']}
                        });
                        // return;
                    }
                }

                //若为多边形，则计算获得外接矩形，取其最长的边长；
                var base = this.getlengthByfeature(feature);

                if (radiusStartUnit == "fraction" && base && this.isRealNum(radiusStart)) {
                    radiusStart *= base;
                }
                if (radiusEndUnit == "fraction" && base && this.isRealNum(radiusEnd)) {
                    radiusEnd *= base;
                }
                //动画类型
                var animType = item['easing'];

                //计算扩散半径
                // var radiusVari = ol.easing.easeOut(elapsedRatio) * (radiusEnd - radiusStart) + radiusStart;
                var radiusVari = this.caculateWaveRadius(animType, elapsedRatio, radiusEnd, radiusStart);
                //创建canvas对象
                var cnv = document.createElement('canvas');
                var ctx = cnv.getContext('2d');

                var fillId = item['fillId'];

                //创建渐变对象
                var gradient = this.generateGradient(fillId, radiusVari, cnv);
                //生成样式；
                var style;
                if (radiusVari && gradient) {
                    style = this.generateCircleStyle(radiusVari, gradient);
                }
                if (style && style instanceof ol.style.Style) {
                    vectorContext.setStyle(style);
                    vectorContext.drawGeometry(geom);
                }
                if (elapsed > period) {
                    // this.start = new Date().getTime();
                    var time = new Date().getTime();
                    obj['startTime'] = time;
                    this.dispatchEvent({type: 'update-animate-param', param: obj})
                }
                // this.map.render();
                this.dispatchEvent({type: 'render-map', param: {msg: "wave need map render"}});
            }
        }
        //生成渐变对象
        Animate.prototype.generateGradient = function (fillId, radiusVari, canvas) {
            if (fillId && this.styleDef[fillId] && this.styleDef[fillId]['infoId']) {
                var infoId = this.styleDef[fillId]['infoId'];
                if (infoId && this.styleDefFill && this.styleDefFill[infoId]) {
                    var colorLikeId = this.styleDefFill[infoId]['colorLikeId'] || null;
                    if (colorLikeId && this.colorLike && this.colorLike[colorLikeId]) {
                        var item = this.colorLike[colorLikeId];
                        if (item && item['type']) {
                            var type = item['type'];
                            var colorLikeString = (item['colorLike'] && item['colorLike']['value']) ? item['colorLike']['value'] : {}
                            var colorLike = JSON.parse(colorLikeString);
                            switch (type) {
                                case "pattern_point": {
                                    return this.generatePointPattern(colorLike, radiusVari, canvas)
                                }
                                case "pattern_line": {
                                    return this.generateLinePattern(colorLike, radiusVari, canvas);
                                }
                                case "gradient_linear": {
                                    return this.generateLinearGradient(colorLike, radiusVari, canvas)
                                }
                                case "gradient_radial": {
                                    return this.generateRadialGradient(colorLike, radiusVari, canvas)

                                }
                            }
                        }
                    } else {
                        var item = this.styleDefFill[infoId];
                        if(item && item.hasOwnProperty('color')){
                            return item['color'];
                        }
                    }
                }
            }
        }
        Animate.prototype.generateLinePattern = function (colorLike, radiusVari, canvas) {
            var ctx;
            if (canvas) {
                ctx = canvas.getContext('2d');
            }
            if (colorLike && JSON.stringify(colorLike) != "{}" && ctx) {
                if (colorLike['canvasWidth']) {
                    canvas.width = colorLike['canvasWidth'];
                    if (colorLike['canvasWidthUnit'] == "fraction" &&
                        this.isRealNum(canvas.width) && this.isRealNum(radiusVari)) {
                        canvas.width *= 2 * radiusVari;
                    }
                }
                if (colorLike['canvasHeight']) {
                    canvas.height = colorLike['canvasHeight'];
                    if (colorLike['canvasHeightUnit'] == "fraction" &&
                        this.isRealNum(canvas.height) && this.isRealNum(radiusVari)) {
                        canvas.height *= 2 * radiusVari;
                    }
                }
                if (colorLike['canvasBackgroundColor']) {
                    ctx.fillStyle = colorLike['canvasBackgroundColor'];
                }
                //如果canvas有宽度或高度为0，渲染效果无效；
                if (canvas.width >= 0 && canvas.height >= 0) {
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.beginPath();
                    ctx.fill();
                    ctx.lineWidth = colorLike['lineWidth'];
                    ctx.strokeStyle = "red";
                    // context.strokeStyle = colorValue['lineColor'];
                    var distance = (colorLike['lineDistance'] && colorLike['lineDistance'] >= 10) ? colorLike['lineDistance'] : 10;
                    var angle = colorLike['angle'];
                    var lineStartPointX = colorLike['lineStartPointX'];
                    var lineStartPointY = colorLike['lineStartPointY'];
                    if (this.isRealNum(distance) && this.isRealNum(lineStartPointX) && this.isRealNum(lineStartPointY)) {
                        var lineEndPointX, lineEndPointY;
                        var deltaX, deltaY;
                        if (angle == 0) {
                            //水平线,只往下填充；
                            deltaY = distance;
                            for (var i = 0; i < (canvas.height - lineStartPointY) / deltaY; i++) {
                                ctx.moveTo(lineStartPointX, lineStartPointY + deltaY * i);
                                ctx.lineTo(canvas.width, lineStartPointY + deltaY * i);
                            }
                        } else if (angle == 90) {
                            //    垂直线，之往右填充,不往左；
                            deltaX = distance;
                            for (var i = 0; i < (canvas.width - lineStartPointX) / distance; i++) {
                                ctx.moveTo(lineStartPointX + deltaX * i, lineStartPointY);
                                ctx.lineTo(lineStartPointX + deltaX * i, canvas.height);
                            }
                        } else if (angle == -45) {
                            lineEndPointX = canvas.height - lineStartPointY / Math.atan(angle);
                            lineEndPointY = canvas.height;
                            for (var i = 0; i < canvas.width / distance; i++) {
                                ctx.moveTo(lineStartPointX + i * distance, lineStartPointY);
                                ctx.lineTo(lineEndPointX + i * distance, lineEndPointY);
                            }
                        } else if (angle == 45) {
                            //只往上填充，不往下填充，且起点要位于canvas内；
                            if (lineStartPointY > 0) {
                                lineEndPointX = lineStartPointX + lineStartPointY / Math.atan(angle);
                                lineEndPointY = 0;
                                for (var i = 0; i < canvas.width / distance; i++) {
                                    ctx.moveTo(lineStartPointX + i * distance, lineStartPointY);
                                    ctx.lineTo(lineEndPointX + i * distance, lineEndPointY);
                                }
                            }
                        } else {
                            //    斜线,填充方向为由左上角点开始往右下方填充,终点的y的值均为0；
                            lineEndPointX = Math.atan(angle) * lineStartPointY;
                            lineEndPointY = 0;
                            for (var i = 0; i < canvas.width / distance; i++) {
                                ctx.moveTo(lineStartPointX + i * distance, lineStartPointY);
                                ctx.lineTo(lineEndPointX + i * distance, lineEndPointY);
                            }
                        }
                        ctx.stroke();
                        var pattern = ctx.createPattern(canvas, 'repeat');
                        return pattern;
                    }
                }
            }

        }

        //线型渐变
        Animate.prototype.generateLinearGradient = function (colorLike, radiusVari, canvas) {
            if (colorLike && JSON.stringify(colorLike) != "{}") {
                // var colorStop = value['colorStop'];
                var x0Unit = colorLike['x0Unit'];
                var x0 = colorLike['x0'];
                if (x0Unit == "fraction"
                    && this.isRealNum(x0) && this.isRealNum(radiusVari)) {
                    x0 *= 2 * radiusVari;
                }
                var y0Unit = colorLike['y0Unit'];
                var y0 = colorLike['y0']
                if (y0Unit == "fraction"
                    && this.isRealNum(y0) && this.isRealNum(radiusVari)) {
                    y0 *= 2 * radiusVari;
                }
                var x1Unit = colorLike['x1Unit'];
                var x1 = colorLike['x1'];
                if (x1Unit == "fraction"
                    && this.isRealNum(x1) && this.isRealNum(radiusVari)) {
                    x1 *= 2 * radiusVari;
                }
                var y1 = colorLike['y1'];
                var y1Unit = colorLike['y1Unit'];
                if (y1Unit == "fraction"
                    && this.isRealNum(y1) && this.isRealNum(radiusVari)) {
                    y1 *= 2 * radiusVari;
                }
                var gradient;
                if (canvas) {
                    var ctx = canvas.getContext('2d');
                    if (this.isRealNum(x0) && this.isRealNum(y0) && ctx
                        && this.isRealNum(x1) && this.isRealNum(y1)) {
                        gradient = ctx.createLinearGradient(x0, y0, x1, y1);
                    }

                }
                //为渐变对象添加色阶；
                var colorStop = colorLike['colorStop'];
                if (colorStop && gradient) {
                    this.addColorStop(gradient, colorStop);
                }
                return gradient;
            }
        }
        //点图形渐变
        Animate.prototype.generatePointPattern = function (colorLike, radiusVari, canvas) {
            if (canvas && canvas.getContext('2d')) {
                var ctx = canvas.getContext('2d');
                if (colorLike && ctx) {
                    if (colorLike['canvasWidth']) {
                        canvas.width = colorLike['canvasWidth'];
                        if (colorLike['canvasWidthUnit'] == "fraction"
                            && this.isRealNum(canvas.width) && this.isRealNum(radiusVari)) {
                            canvas.width *= 2 * radiusVari;
                        }
                    }
                    if (colorLike['canvasHeight']) {
                        canvas.height = colorLike['canvasHeight'];
                        if (colorLike['canvasHeightUnit'] == "fraction"
                            && this.isRealNum(canvas.height) && this.isRealNum(radiusVari)) {
                            canvas.height *= 2 * radiusVari;
                        }
                    }
                    if (colorLike['canvasBackgroundColor']) {
                        ctx.fillStyle = colorLike['canvasBackgroundColor'];
                    }
                    if (canvas.width >= 0 && canvas.height >= 0) {
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                    ctx.fillStyle = colorLike['pointColor'];
                    ctx.beginPath();
                    var arcX = colorLike['arcX'];
                    if (colorLike['arcXUnit'] && colorLike['arcXUnit'] == "fraction"
                        && this.isRealNum(arcX) && this.isRealNum(radiusVari)) {
                        arcX *= 2 * radiusVari;
                    }
                    var arcY = colorLike['arcY'];
                    if (colorLike['arcYUnit'] && colorLike['arcYUnit'] == "fraction"
                        && this.isRealNum(arcY) && this.isRealNum(radiusVari)) {
                        arcY *= 2 * radiusVari;
                    }
                    var arcR = colorLike['arcR'];
                    if (colorLike['arcRUnit'] && colorLike['arcRUnit'] == "fraction"
                        && this.isRealNum(arcR) && this.isRealNum(radiusVari)) {
                        arcR *= 2 * radiusVari;
                    }
                    var startAngle = colorLike['arcStartAngle'];
                    var endAngle = colorLike['arcEndAngle'];
                    var acrAntiClockwise = colorLike['acrAntiClockwise'];
                    if (this.isRealNum(arcX) && this.isRealNum(arcY) && this.isRealNum(arcR)
                        && this.isRealNum(startAngle) && this.isRealNum(endAngle)) {
                        ctx.arc(arcX, arcY, arcR, startAngle, endAngle, acrAntiClockwise);
                        ctx.fill();
                    }
                    var pattern = ctx.createPattern(canvas, 'repeat');
                    return pattern;
                }
            }
        }
        //径向渐变
        Animate.prototype.generateRadialGradient = function (colorLike, radiusVari, canvas) {
            if (colorLike && JSON.stringify(colorLike) != "{}") {
                var r0, r1, x0, x1, y0, y1, colorStop;
                if (colorLike.hasOwnProperty('colorStop')) {
                    colorStop = colorLike['colorStop'];
                }
                if (colorLike.hasOwnProperty('r0')) {
                    r0 = colorLike['r0'];
                }
                if (colorLike['r0Unit'] == "fraction"
                    && this.isRealNum(r0) && this.isRealNum(radiusVari)) {
                    r0 *= 2 * radiusVari;
                }
                if (colorLike.hasOwnProperty('x0')) {
                    x0 = colorLike['x0'];
                    if (colorLike['x0Unit'] == "fraction"
                        && this.isRealNum(x0) && this.isRealNum(radiusVari)) {
                        x0 *= 2 * radiusVari;
                    }
                }
                if (colorLike.hasOwnProperty('y0')
                ) {
                    y0 = colorLike['y0'];
                    if (colorLike['y0Unit'] == "fraction"
                        && this.isRealNum(y0) && this.isRealNum(radiusVari)) {
                        y0 *= 2 * radiusVari;
                    }
                }
                if (colorLike.hasOwnProperty('r1')) {
                    r1 = colorLike['r1'];
                    if (colorLike['r0Unit'] == "fraction"
                        && this.isRealNum(r1) && this.isRealNum(radiusVari)) {
                        r1 *= 2 * radiusVari;
                    }
                }
                if (colorLike.hasOwnProperty('x1')) {
                    x1 = colorLike['x1'];
                    if (colorLike['x1Unit'] == "fraction"
                        && this.isRealNum(x1) && this.isRealNum(radiusVari)) {
                        x1 *= 2 * radiusVari;
                    }
                }
                if (colorLike.hasOwnProperty('y1')) {
                    y1 = colorLike['y1'];
                    if (colorLike['y1Unit'] == "fraction"
                        && this.isRealNum(y1) && this.isRealNum(radiusVari)) {
                        y1 *= 2 * radiusVari;
                    }
                }
                if (canvas) {
                    var ctx = canvas.getContext('2d');
                    if (r0 >= 0 && r1 >= 0 && this.isRealNum(x0) && this.isRealNum(y0)
                        && this.isRealNum(x1) && this.isRealNum(y1)) {
                        var gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
                        //为渐变色添加色阶；
                        if (colorStop && gradient) {
                            this.addColorStop(gradient, colorStop);
                        }
                        return gradient;
                    }
                }
            }
        }
        //生成渐变对象为渲染色的圆形样式；
        Animate.prototype.generateCircleStyle = function (radius, gradient) {
            var style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: radius,
                    snapToPixels: false,
                    fill: new ol.style.Fill({
                        color: gradient
                    })
                })
            })
            return style;
        }
        //根据要素计算外接矩形的最长的边长；
        Animate.prototype.getlengthByfeature = function (feature) {
            if (feature && feature instanceof ol.Feature) {
                var geom = feature.getGeometry();
                if (geom instanceof ol.geom.Polygon || geom instanceof ol.geom.MultiPolygon || geom instanceof ol.geom.LineString
                    || geom instanceof ol.geom.MultiPoint || geom instanceof ol.geom.MultiLineString) {
                    var base;
                    var extent = geom.getExtent();
                    var height = ol.extent.getHeight(extent);
                    var width = ol.extent.getWidth(extent);
                    if (height >= width) {
                        base = height;
                    } else {
                        base = width;
                    }
                    return base;
                }
            }
        }
        //计算渐变对象的起始圆与最大圆的圆心坐标及半径参数；
        Animate.prototype.caculateCircleParam = function (fillId, radiusVari) {
            var obj = {};
            var r0, r1, x0, x1, y0, y1, colorStop, infoId;
            // var json = this.json;
            if (fillId && this.styleDef[fillId] && this.styleDef[fillId]['infoId']) {
                infoId = this.styleDef[fillId]['infoId'];
            }
            if (infoId && this.styleDefFill && this.styleDefFill[infoId]) {
                // if(this.s)
                var colorLikeId = this.styleDefFill[infoId]['colorLikeId'] || null;
                if (colorLikeId && this.colorLike && this.colorLike[colorLikeId]) {
                    var item = this.colorLike[colorLikeId];
                    if (item) {
                        var colorLikeString = (item['colorLike'] && item['colorLike']['value']) ? item['colorLike']['value'] : {}
                        var colorLike = JSON.parse(colorLikeString);
                        //渐变色，色阶值
                        colorStop = colorLike['colorStop'];
                        obj['colorStop'] = colorStop;
                        if (colorLike && JSON.stringify(colorLike) != "{}") {
                            if (colorLike.hasOwnProperty('r0')) {
                                r0 = colorLike['r0'];
                            }
                            if (colorLike['r0Unit'] == "fraction"
                                && this.isRealNum(r0) && this.isRealNum(radiusVari)) {
                                r0 *= 2 * radiusVari;
                            }
                            if (colorLike.hasOwnProperty('x0')) {
                                x0 = colorLike['x0'];
                                if (colorLike['x0Unit'] == "fraction"
                                    && this.isRealNum(x0) && this.isRealNum(radiusVari)) {
                                    x0 *= 2 * radiusVari;
                                }
                            }
                            if (colorLike.hasOwnProperty('y0')) {
                                y0 = colorLike['y0'];
                                if (colorLike['y0Unit'] == "fraction"
                                    && this.isRealNum(y0) && this.isRealNum(radiusVari)) {
                                    y0 *= 2 * radiusVari;
                                }
                            }
                            if (colorLike.hasOwnProperty('r1')) {
                                r1 = colorLike['r1'];
                                if (colorLike['r0Unit'] == "fraction"
                                    && this.isRealNum(r1) && this.isRealNum(radiusVari)) {
                                    r1 *= 2 * radiusVari;
                                }
                            }
                            if (colorLike.hasOwnProperty('x1')) {
                                x1 = colorLike['x1'];
                                if (colorLike['x1Unit'] == "fraction"
                                    && this.isRealNum(x1) && this.isRealNum(radiusVari)) {
                                    x1 *= 2 * radiusVari;
                                }
                            }
                            if (colorLike.hasOwnProperty('y1')) {
                                y1 = colorLike['y1'];
                                if (colorLike['y1Unit'] == "fraction"
                                    && this.isRealNum(y1) && this.isRealNum(radiusVari)) {
                                    y1 *= 2 * radiusVari;
                                }
                            }
                        }
                    }
                }
            }
            obj['r0'] = r0;
            obj['r1'] = r1;
            obj['x0'] = x0;
            obj['x1'] = x1;
            obj['y0'] = y0;
            obj['y1'] = y1;
            return obj;
        }
        //为渐变色添加色阶；
        Animate.prototype.addColorStop = function (gradient, colorStop) {
            if (colorStop && colorStop.length) {
                for (var i = 0; i < colorStop.length; i++) {
                    var ele = colorStop[i];
                    var stop = ele['stop'];
                    var color = ele['color'];
                    if (stop && color) {
                        gradient.addColorStop(stop, color);
                    }
                }
            }
        }
        Animate.prototype.getAnimParam = function (styleId) {
            if (styleId && this.styleDef && this.styleDef[styleId]) {
                var item;
                var styleDef = this.styleDef[styleId];
                if (styleDef && styleDef['infoId'] && styleDef['type']) {
                    var infoId = styleDef['infoId'];
                    var type = styleDef['type'];
                    //水波纹扩散效果
                    if (type == "style_anim_wave") {
                        item = this.styleAnimWave[infoId];
                        item['type'] = type;
                    } else if (type == "style_anim_blink") {
                        //    闪烁
                        item = this.styleAnimBlink[infoId];
                        item['type'] = type;
                    }
                    return item;
                }
            }
        }
        // return Animate;
        export default Animate
//     }
// )
