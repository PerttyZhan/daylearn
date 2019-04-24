# Array基本用法

##  join
join(separator): 将数组的元素组成一个字符串，义separator为分隔符。省略的话用逗号为分隔符。该方法值接收一个参数
```javascript
    var arr = [1,2,3]
    console.log(arr.join('')) // 1,2,3
    console.log(arr.join('-')) // 1-2-3
    console.log(arr) // [1,2,3] 
```
通过join()方法可以实现重复字符串，只需要传入字符串和重复的次数
```javascript
    function repreatStr (str, n) {
        return new Array(n + 1).join(str)
    }
    console.log(repreatStr('abc', 3)) // abcabcabc
```
----
##  push 和 pop
push: 可以接收任意数量的参数，把它们组个添加到数组末尾，并返回修改后数组的长度
pop: 数组末尾删除最后一项，减少数组的length值，然后返回移除的项
```javascript
    var arr = ['liyi', 'lucy', 'tom']
    var count - arr.push('jack', 'sean')
    console.log(count)  // 5
    console.log(arr)    // ['liyi', ..., 'sean']
    var item = arr.pop()
    console.log(item)   // sean
    console.log(arr)    // ['liyi', ..., 'jack']
```
----
##  shift 和 unshift
shift: 删除数组第一项，并返回删除元素的值，如果数组为空则返回undefined
unshift: 将参数添加到原数组的开头，并返回数组的长度
```javascript
    var arr = ["Lily","lucy","Tom"];
    var count = arr.unshift("Jack","Sean");
    console.log(count); // 5
    console.log(arr); //["Jack", "Sean", "Lily", "lucy", "Tom"]
    var item = arr.shift();
    console.log(item); // Jack
    console.log(arr); // ["Sean", "Lily", "lucy", "Tom"]
```
----
##  sort
sort: 按升序排列数组项----即最小的一项位于最前面，最大的值排在最后面
sort方法可以接收一个比较函数作为参数，指令哪个值在哪个值的前面。如果第一个参数应该位于第二个参数的前面则返回负数
```
    function compare(value1, value2) {
        if (value1 < value2) {
        return -1;
        } else if (value1 > value2) {
        return 1;
        } else {
        return 0;
        }
    }
    arr2 = [13, 24, 51, 3];
    console.log(arr2.sort(compare)); // [3, 13, 24, 51]

    function compare(value1, value2) {
        if (value1 < value2) {
        return 1;
        } else if (value1 > value2) {
        return -1;
        } else {
        return 0;
        }
    }
    arr2 = [13, 24, 51, 3];
    console.log(arr2.sort(compare)); // [51, 24, 13, 3]
```
----
##  reverse
reverse: 反转当前数组的顺序
```
    var arr = [13, 24, 51, 3];
    console.log(arr.reverse()); //[3, 51, 24, 13]
    console.log(arr); //[3, 51, 24, 13](原数组改变)
``` 
----
##  concat
concat: 讲参数添加到原数组中，这个方法会先创建当前数组的一个副本，然后将接收到的参数添加到这个副本的末尾，最后返回新构建的数组，在没有给concat方法传递参数的情况下，它只是复制当前数组并返回副本。
```javascript
    var arr = [1,3,5,7];
    var arrCopy = arr.concat(9,[11,13]);
    console.log(arrCopy); //[1, 3, 5, 7, 9, 11, 13]
    console.log(arr); // [1, 3, 5, 7](原数组未被修改)

    var arrCopy2 = arr.concat([9,[11,13]]);
    console.log(arrCopy2); //[1, 3, 5, 7, 9, Array[2]]
    console.log(arrCopy2[5]); //[11, 13]
```
----
##  slice
slice: 返回从原数组指令开始下标到结束下标之间的项组成的新数组，slice可以接收一或者两个参数，级开始和结束。如果有两个参数，不包括结束位置的项
```
    var arr = [1,3,5,7,9,11];
    var arrCopy = arr.slice(1);
    var arrCopy2 = arr.slice(1,4);
    var arrCopy3 = arr.slice(1,-2);
    var arrCopy4 = arr.slice(-4,-1);
    console.log(arr); //[1, 3, 5, 7, 9, 11](原数组没变)
    console.log(arrCopy); //[3, 5, 7, 9, 11]
    console.log(arrCopy2); //[3, 5, 7]
    console.log(arrCopy3); //[3, 5, 7]
    console.log(arrCopy4); //[5, 7, 9]
```