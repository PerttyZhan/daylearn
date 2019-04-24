# markdown基本语法

## 1. 标题  
```
    # 这是一级标题
    ## 这是二级标题
    以此类推
```
效果如下：  
#  h1
## h2
----
## 2.字体  
+ **加粗**  
要加粗的文字左右分别用一个*号包起来  
+ *斜体*  
要倾斜的文字左右分别用一个*号包起来  
+ ***斜体加粗***  
要斜体和加粗的文字左右用三个*号包起来
+ ~~删除线~~  
要加删除线的文字左右分别用两个~~号包起来
----
## 3.引用
在引用的文字前面加>即可.引用也可以嵌套，如加两个>>三个>>>
```
  >这是引用的内容
  >>这是引用的内容
```
效果如下：
> 这是引用的内容
>> 这是引用的内容
----
## 4.分割线
三个或者三个以上的-或者*都可以
示例：
```
  ---
  ----
  ***
  ****
```
效果如下：
---
----
***
****
## 5.图片
语法：
```
  ![图片alt](图片地址 "图片title")
  图片alt就是显示在图片下面的文字,相当于对图片内容的解释。
  图片title是图片的标题，当鼠标移到图片上时显示的内容。title可加可不加
```
示例：
```
  ！[blockchain](https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/
u=702257389,1274025419&fm=27&gp=0.jpg "区块链")
```
效果如下：  

![blockchain](https://ss0.bdstatic.com/70cFvHSh_Q1YnxGkpoWK1HF6hhy/it/u=702257389,1274025419&fm=27&gp=0.jpg "区块链")
----
## 6.超链接
语法：
```
  [超链接](超链接地址 "超链接title")
  title可加可不加
```
示例：
```
  [简书](http://jianshu.com "简书")
  [百度](http://baidu.com "百度")
```
效果如下：  
  [简书](http://jianshu.com "简书")  
  [百度](http://baidu.com "百度")  
----
## 7.列表
+ ### 无序列表  
语法：
无序列表可用 - + * 任何一种都可以
```
  - 列表内容
  + 列表内容
  * 列表内容

  注意： - + *
```
效果如下：  
+ 列表内容
- 列表内容
* 列表内容

+ ### 有序列表
语法：
数学加点   
```
  1. 列表内容
  2. 列表内容
  3. 列表内容
```
效果如下：  
1. 列表内容  
2. 列表内容  
3. 列表内容  

+ ### 列表嵌套  
#### + 上一层列表Tab + 第二层列表TAB
+ 一级列表内容    
    + 二级列表内容
+ 一级列表内容    
    1. 二级列表
    2. 二级列表内容

----
## 8.表格
语法：
```
  表头|表头|表头
  :---|:---:|---:
  内容|内容|内容
  内容|内容|内容

  第二行分割表头和内容。
  - 有一个就行，为了对齐，多加几个
  文字默认居左
  -两边加：表示文字居中
  -右边加: 标识文字居右
```
效果如下：  
  
  **姓名**|**技能**|**排行**
  ---|:---:|:---
  刘备|哭|大哥
  关羽|打|二哥
  张飞|骂|三弟