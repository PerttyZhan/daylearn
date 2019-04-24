
# 数组内任意数结合

```
function combine_deverse (arr, start, result, count) {
  for (var i = start; i <= (arr.length - count); i++) {
    if (count > 1) {
      combine_deverse(arr, i + 1, result.concat([arr[i]]), count - 1)
    } else {
      console.log(result.concat([arr[i]]).join(','))
      all.push(result.concat([arr[i]]))
    }
  }
}

function fetchAllCombinate (arr) {
  var len = arr.length

  for (var i = 1; i <= len; i++) {
    combine_deverse(arr, 0, [], i)
  }
}

var all = []
var source = [1,2,3,4]

combine_deverse(source, 0, [], 2)
```
