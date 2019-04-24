// define('gais/map/StatusMange', ['ol'], function (ol) {
import ol from './ol'
    var StatusManage = function (opt) {
        ol.Object.call(this);
        this.json = opt.json || {};
    }
    ol.inherits(StatusManage, ol.Object);
    StatusManage.prototype.init = function () {
        this.featureStatusObj = {};
    }
    /**要素的状态与样式是一对一的关系；但是要素最终呈现的效果是多个状态叠加的综合结果
     *
     * @param 状态编码的组合
     * @param 要素的Id
     * @param 要素所属的图层
     * @param 地图工作空间编码
     * @param 地图编码
     */
    //变更状态接口
    StatusManage.prototype.updateStatus = function (param) {
        //    要素状态与样式是一对一的关系

        if (param && param.length) {
            for (var i = 0; i < param.length; i++) {
                var item = param[i];
                var featureId = item["featureId"];
                var layerCode = item['layerCode'];
                var layerWorkspace = item['layerWorkspace'];
                var statusArray = item['status'].split(',');
                if (statusArray && statusArray.length) {
                    //变更方式
                    var type = item['operate'];
                    switch (type) {
                        //添加
                        case "add" : {
                            this.addStatus(featureId, layerCode, layerWorkspace, statusArray);
                            break;
                        }
                        //追加
                        case  "append": {
                            this.appendStatus(featureId, layerCode, layerWorkspace, statusArray);
                            break;
                        }
                        //替换
                        case  "replace": {
                            this.replaceStatus(featureId, layerCode, layerWorkspace, statusArray);
                            break;
                        }
                        //删除
                        case "delete" : {
                            this.deleteStatus(featureId, layerCode, layerWorkspace, statusArray);
                            break;
                        }
                        //清除
                        case "clear": {
                            this.clearStatus(featureId, layerCode, layerWorkspace, statusArray);
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            }
            this.dispatchEvent({type: 'update-status-success', param: this.featureStatusObj});
        }
    }
    //地图要素缩放，致使地图范围发生变更，数据源刷新，恢复地图要素状态接口
    StatusManage.prototype.recoveryFeatureByObj = function () {
        if (JSON.stringify(this.featureStatusObj) != "{}") {
            this.dispatchEvent({type: 'update-status-success', param: this.featureStatusObj});
        }
    }
    //添加状态
    StatusManage.prototype.addStatus = function (featureId, layerCode, layerWorkspace, statusArray) {
        var elem = this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId];
        //已经有状态的要素不能再新增状态；
        if (!elem && featureId && layerCode) {
            var obj = {};
            obj['statusArray'] = statusArray
            this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId] = obj;
            this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId]['type'] = "add";
        }
    }
    //追加状态
    StatusManage.prototype.appendStatus = function (featureId, layerCode, layerWorkspace, statusArray) {
        var elem = this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId];
        if (elem) {
            //检查重复的状态，以防一状态多叠加；
            elem['statusArray'] = this.arrayUnique(elem['statusArray'], statusArray);
            elem['type'] = "append";
        }
    }
    //替换状态,整体替换
    StatusManage.prototype.replaceStatus = function (featureId, layerCode, layerWorkspace, statusArray) {
        // var elem = this.featureStatusObj[layerCode + "_" + layerWorkspace + "_" + featureId];
        var elem = this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId];
        if (elem) {
            //检查重复的状态，以防一状态多叠加；
            elem['statusArray'] = statusArray;
            elem['type'] = "append";
        }
        // var obj = {};
        // obj['statusArray'] = statusArray;
        // this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId] = obj;
        // this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId]['type'] = "replace";

    }
    //删除状态
    StatusManage.prototype.deleteStatus = function (featureId, layerCode, layerWorkspace, statusArray) {
        var elem = this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId];

        if (elem && elem['statusArray']) {
            elem['statusArray'] = this.arrayDiffer(elem['statusArray'], statusArray);
            elem['type'] = "delete";
        }
    }
    //清除状态
    StatusManage.prototype.clearStatus = function (featureId, layerCode, layerWorkspace) {
        var elem = this.featureStatusObj[layerCode + ":" + layerWorkspace + ":" + featureId];
        if (elem) {
            elem['type'] = "clear";
            elem['statusArray'].length = 0;
        }
    }
    //清空状态对象中的某个对象
    StatusManage.prototype.emptyStatusObj=function (layerCode,layerWorkspace,featureId) {
        var key = layerCode+":"+layerWorkspace+":"+featureId;
        if(this.featureStatusObj && this.featureStatusObj[key]){
            delete this.featureStatusObj[key];
        }
    }
    //数组去重
    StatusManage.prototype.arrayUnique = function (arr1, arr2) {
        for (var i = 0; i < arr1.length; i++) {
            for (var j = 0; j < arr2.length; j++) {
                if (arr1[i] === arr2[j]) {
                    arr1.splice(i, 1);  //利用splice函数删除元素，从第i个位置，截取长度为1的元素
                }
            }
        }
        for (var i = 0; i < arr2.length; i++) {
            arr1.push(arr2[i]);
        }
        return arr1;
    }
    //数组求差
    StatusManage.prototype.arrayDiffer = function (arr1, arr2) {
        var arr3 = [];
        for (var i = 0; i < arr1.length; i++) {
            var flag = true;
            for (var j = 0; j < arr2.length; j++) {
                if (arr2[j] == arr1[i]) {
                    flag = false;
                }
            }
            if (flag) {
                arr3.push(arr1[i]);
            }
        }
        return arr3;
    }
    // return StatusManage;
    export default StatusManage
// })