/**
 * Created by tangwenjing on 2018/10/15.
 */
// define('gais/map/CoordinateTransform', ['proj4', 'gais/map/Ajax'], function (proj4, Ajax) {
    import proj4 from './proj4'
    import Ajax from './Ajax'
    var CoordinateInfo = function (opts) {
        // this.url = opts.url || '';
    }
    CoordinateInfo.prototype.init = function () {
        // this.ep = new EventProxy();
        this.compare = {};
    }
    CoordinateInfo.prototype.getCRSInfo = function (code, callback, param) {
        Ajax.ajax({
            url: url + "web/crsInfo/query",
            data: {
                epsgCode: code
            },
            method: 'GET',
            dataType: 'json',
            success: function (json) {
                if (json.errorCode == "0" && json.data) {
                    var projs = json.data;
                    // if (this.ep) {
                    //     this.ep.emit('get-' + code + '-success', {code: projs})
                    // }
                    this.compare[code] = projs;
                }
            }
        })
    }
    /**
     * 根据两个坐标系的坐标点的换算
     * @param firstCode
     * @param secondeCode
     * @param coor
     */
    CoordinateInfo.prototype.transFormCoordinate = function (firstCode, secondeCode, coor) {
        this.compare = {};
        if (firstCode && secondeCode) {
            // if (this.ep) {
            //     this.ep.all(['get-' + firstCode + '-success', 'get-' + secondeCode + '-success'], function (data) {
            //         for (var i in this.compare) {
            //             proj4.defs(i, this.compare[i]);
            //         }
            //         /**
            //          * 第一个坐标系转换成第二个坐标系
            //          */
            //         var newCoor = proj4(proj4(firstCode), proj4(secondeCode)).forward(coor);
            //         return newCoor;
            //     })
            // }
            this.getCRSInfo(firstCode, this.getCRSInfo, {code: secondeCode, coor: coor});
            this.getCRSInfo(secondeCode);
        }
    }

    /**
     * 根据投影信息定义坐标
     * @param first     包含code与proj两个key分别存放epsg编码与坐标投影信息；
     * @param second    包含code与proj两个key分别存放epsg编码与坐标投影信息；
     * @param coor      需要转换的坐标
     */
    CoordinateInfo.prototype.convertCoordinate = function (first, second, coor) {
        if (coor && coor.length) {
            coor = coor.split(",");
            for (var i = 0; i < coor.length; i++) {
                coor[i] = Number(coor[i]);
            }
        }
        if (first && first.code && first.proj && second &&
            second.code && second.proj && coor && coor.length) {
            proj4.defs(first.code, first.proj);
            proj4.defs(second.code, second.proj);
            var result = proj4(proj4(first.code), proj4(second.code)).forward(coor);
            for (var i = 0; i < result.length; i++) {
                // if (result[i].indexOf(".") && result[i].split(".").length >= 2 && result[i].split(".")[1] > 8) {
                    result[i] = result[i].toFixed(8);
                // }

            }
            return result;
        }
    }
    // return CoordinateInfo;
    export default CoordinateInfo
// })
