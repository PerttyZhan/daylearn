#   Array方法

# 1. Spread operator (展开操作符)
将数组或者对象展开
```javascript
    const favs = ['pizza', 'fries', 'swedish-metballs']
    console.log(...favs)
    // pizza fries swedish-metballs
```

# 2. for...of 迭代器
**for...of** 语句循环/便利集合，为你提供修改特定元素的功能，它取代传统的 **for-loop** 方式

```javascript
    const toolBox = ['h', 's', 'r']
    for (const item of toolBox) {
        console.log(item)
    }
    // h
    // s
    // r
```

# 3. Includes 方法
**includes(searchElement， fromIndex)** 方法被用来检查数集合中是否包含指定的元素，如果存在则返回 **true**，否则返回 **false**。区分大小写的。

 ```javascript
    const age = [11, 22, 33]
    console.log(a.includes(11)) // true
    console.log(a.includes('111')) // false
 ```

 # 4. some 方法
**some()** 方法检查在数组中是否存在某些元素，如果存在返回 **true**, 否则返回 **false**. 这个和includes方法相似，但some 方法的参数是一个函数。而不是一个字符串

```javascript
    const age = [11, 22, 33]
    age.some((person) => person > 19)
    // output true
```

# 5. every 方法
**every** 方法循环遍历数组，检查数组中的每一个元素项，并返回true或false。与some概念相似。但每一个项都必须通过条件表达式，否则返回false

```javascript
    const age = [11, 22, 33]
    age.every((person) => person >= 16)
    // output false
```

# 6. filter 方法
**filter** 方法创建一个包含所有通过测试的元素的新数组

```javascript
    const age = [11, 22, 33]
    age.filter((person) => person > 18)
    //output [22, 33]
```

# 7. map 方法
在返回新数组方面，map 方法跟 filter 相似、但是，唯一的区别是它用于修改数组中的元素项。

```javascript
    const age = [11, 22, 33]
    age.map((person) => person * 2)
    // output [22, 44, 66]
```

# 8. Reduce 方法
**reduce** 方法可用于将数组装换成其它内容，可以是正式，对象，promise。

```javascript
    const age = [11, 22, 33]
    age.reduce((p1, p2) => p1 + p2)
    // output 66
```
