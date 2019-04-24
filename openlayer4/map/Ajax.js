/**
 * Created by tangwenjing on 2018/9/11.
 */
// define('gais/map/Ajax', [], function () {
    var Ajax = Ajax || {}
    Ajax.createXHR = function () {
        if (window.XMLHttpRequest) {    //IE7+、Firefox、Opera、Chrome 和Safari
            return new XMLHttpRequest();
        } else if (window.ActiveXObject) {   //IE6 及以下
            var versions = ['MSXML2.XMLHttp', 'Microsoft.XMLHTTP'];
            for (var i = 0, len = versions.length; i < len; i++) {
                try {
                    return new ActiveXObject(versions[i]);
                    break;
                } catch (e) {
                    //跳过
                }
            }
        } else {
            throw new Error('浏览器不支持XHR对象！');
        }
    }
    Ajax.ajax = function (obj) {
        var xhr = this.createXHR();  //创建XHR对象
        //通过使用JS随机字符串解决IE浏览器第二次默认获取缓存的问题
        obj.url = obj.url + '?rand=' + Math.random();
        obj.data = this.formateParams(obj.data);  //通过params()将名值对转换成字符串
        //若是GET请求，则将数据加到url后面
        if (obj.method === 'get' || obj.method === 'GET') {
            if(obj.data){
                obj.url += obj.url.indexOf('?') == -1 ? '?' + obj.data : '&' + obj.data;
            }

        }
        if(obj && !obj.hasOwnProperty('async') ){
            obj.async= true;
        }
        if (obj.async === true) {   //true表示异步，false表示同步
            //使用异步调用的时候，需要触发readystatechange 事件
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {   //判断对象的状态是否交互完成
                    callback();      //回调
                }
            };
        }
        //在使用XHR对象时，必须先调用open()方法，
        //它接受三个参数：请求类型(get、post)、请求的URL和表示是否异步。
        xhr.open(obj.method, obj.url, obj.async);
        if (obj.method === 'post' || obj.method === 'POST') {
            //post方式需要自己设置http的请求头，来模仿表单提交。
            //放在open方法之后，send方法之前。
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.send(obj.data);     //post方式将数据放在send()方法里
        } else {
            xhr.send(null);     //get方式则填null
        }
        if (obj.async === false) {  //同步
            callback();
        }
        function callback() {
            if (xhr.status == 200) {  //判断http的交互是否成功，200表示成功
                var result;
                if(xhr.responseText){
                    result = JSON.parse(xhr.responseText);
                }
                obj.success(result);          //回调传递参数
            } else {
                // console.log('获取数据错误！错误代号：' + xhr.status + '，错误信息：' + xhr.statusText);
            }
        }
    }
    Ajax.formateParams = function (data) {
        if(data){
            var arr = [];
            for (var i in data) {
                //特殊字符传参产生的问题可以使用encodeURIComponent()进行编码处理
                if(data[i]){
                    arr.push(encodeURIComponent(i) + '=' + encodeURIComponent(data[i]));
                }

            }
            return arr.join('&');
        }

    }
    // return Ajax;
    export default Ajax
// })
