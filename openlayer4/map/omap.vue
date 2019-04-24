/*
* @Author: zhengjie7
* @Date: 2018-12-10 16:05:36
 * @Last Modified by: zhengjie7
 * @Last Modified time: 2019-01-08 11:05:50
* @desc 这是基础地图
*/
<template>
  <div id="map-container" class="map-container" v-if="mapFlag">
    <div id="map"
          v-if="!noDataFlag"
          @contextmenu.prevent="rightClick"
         class="map"></div>
    <no-data type="data" v-show="noDataFlag"></no-data>
    <!-- 工具栏 -->
    <div class="top-right" v-show="mapInitFlag">
      <select-map v-if="toolbars.includes('switch-map')"
                  :mapList="mapList"
                  :currentMap="mapConfig"
                  @remove-map="removeMap"
                  :addMap="toolbars.includes('add-map')"
                  @set-default-map="setDefaultMap"
                  @add-map-success="addMapSuccess"
                  @change-map="changeMap"></select-map>
      <div class="dram-area-warpper"
           v-if="toolbars.includes('dram-area')">
        <div class="dram-area" @click="changeDrawSelect">
          <i class="icon-b_ic_pen"></i>
          <span class="dram-area-text">{{$t(`config.map.draw`)}}</span>
          <i :class="areaSelectIcon"></i>
        </div>
        <div class="dram-area-content"
             v-show="drawSelectFlag">
          <ul class="page-sidebar-list">
            <ellipsis tag="li"
                      v-for="(item, index) in drawSelectList"
                      :key="index"
                      :clazz="{ 'active': item.id === currentDraw.id }"
                      @click="currentDraw = item">
              <span>{{ item.name }}</span>
            </ellipsis>
          </ul>
          <div class="dram-area-type">
            <span class="icon-area icon-32 icon-ic_polygon"
                  @click="drwaArea('Polygon')"
                  v-show="currentDraw.id !== 4"></span>
            <span class="icon-line icon-32 icon-ic_line"
                  @click="drwaArea('LineString')"
                  v-show="currentDraw.id !== 4"></span>
            <span class="icon-dot icon-32 icon-ic_dot2"
                  @click="drwaArea('Point')"></span>
          </div>
        </div>
      </div>
      <div class="show-layer-warpper"
           v-if="toolbars.includes('show-layer')">
        <div @click="changeLayer">
          <span class="icon-b_ic_kejian"></span>
          <span class="show-layer">{{$t(`config.map.show`)}}</span>
          <span :class="showIcon"></span>
        </div>
        <div class="show-layer-content"
             v-show="layerFlag">
          <el-checkbox v-model="layerSwitch.traffic">{{$t(`config.map.trafficStatistics`)}}</el-checkbox>
          <el-checkbox v-model="layerSwitch.density">{{$t(`config.map.passengerDensity`)}}</el-checkbox>
          <el-checkbox v-model="layerSwitch.passenger">{{$t(`config.map.passengerStatistics`)}}</el-checkbox>
          <el-checkbox v-model="layerSwitch.insterst" :disabled="!layerSwitch.passenger">{{$t(`config.map.interestAnalysis`)}}</el-checkbox>
          <el-checkbox v-model="layerSwitch.allGroup">{{$t(`config.map.passengerGlobal`)}}</el-checkbox>
          <el-checkbox v-model="layerSwitch.parking">{{$t(`config.map.parkingStatistics`)}}</el-checkbox>
        </div>
      </div>
      <span class="icon-32" :class="fullScreenIcon" @click="fullScreen"></span>
    </div>
    <div class="bottom-right" v-show="mapInitFlag">
      <el-tooltip effect="dark"
                      v-popover:editPopover
                      :content="$t(`common.edit`)"
                      placement="left">
        <span v-if="toolbars.includes('set-home')"
              class="icon-huidaochushiweizhi icon-32"
              @click="setHome"></span>
      </el-tooltip>
      <el-tooltip effect="dark"
                      v-popover:editPopover
                      :content="$t(`common.edit`)"
                      placement="left">
      <span v-if="toolbars.includes('save-home')"
            class="icon-b_ic_save icon-32"
            @click="getHome"></span>
      </el-tooltip>
      <div class="icon-32-group"
           v-if="toolbars.includes('zoom')">
           <el-tooltip effect="dark"
                      v-popover:editPopover
                      :content="$t(`common.edit`)"
                      placement="left">
        <span class="icon-b_ic_subtract_n icon-32"
              @click="zoomIn"></span>
           </el-tooltip>
        <span class="split-line"></span>
        <el-tooltip effect="dark"
                      v-popover:editPopover
                      :content="$t(`common.edit`)"
                      placement="left">
        <span class="icon-b_ic_add_n icon-32"
              @click="zoomOut"></span>
        </el-tooltip>
      </div>
    </div>
    <div class="top-left" v-show="mapInitFlag && layerSwitch.allGroup" v-if="toolbars.includes('show-data')">
      <div class="allin-num">
        <span class="num-light">{{$t(`analysis.map.allInNum`)}}</span>
        <span class="num-weight">{{globalData.totalInPassengersCount}}</span>
        <span class="num-light">{{$t(`analysis.map.peopleUnit`)}}</span>
      </div>
      <div class="allout-num">
        <span class="num-light">{{$t(`analysis.map.allOutNum`)}}</span>
        <span class="num-weight">{{globalData.totalOutPassengersCount}}</span>
        <span class="num-light">{{$t(`analysis.map.peopleUnit`)}}</span>
      </div>
      <div class="has-num">
        <span class="num-light">{{$t(`analysis.map.hasNum`)}}</span>
        <span class="num-weight">{{globalData.totalHavePassengersCount}}</span>
        <span class="num-light">{{$t(`analysis.map.peopleUnit`)}}</span>
      </div>
    </div>
    <div class="bottom-left" v-if="toolbars.includes('map-legend')" v-show="mapInitFlag">
      <span class="traffic-legend">{{$t(`config.map.traffic`)}}</span>
      <span class="passenger-legend">{{$t(`config.map.passenger`)}}</span>
      <span class="density-legend">{{$t(`config.map.density`)}}</span>
      <span class="pre-legend">{{$t(`config.map.preAlarm`)}}</span>
      <span class="alarm-legend">{{$t(`config.map.alarm`)}}</span>
    </div>
    <!-- 添加区域弹窗 -->
    <el-dialog :close-on-click-modal="false"
               :visible.sync="addAreaDialog"
               :append-to-body="true"
               @close="closeDialog"
               :title="addAreaTitle"
               :area="[640,491]">
      <el-form ref="form"
               :model="addAreaForm"
               :rules="rules"
               class="add-area-form"
               content-width="320px"
               label-width="160px">
        <el-form-item :label="$t(`config.map.areaName`)"
                      prop="elementName">
          <el-input v-model="addAreaForm.elementName"></el-input>
        </el-form-item>
        <el-form-item :label="associateArea"
                      prop="sourceId">
          <div class="select-group" :class="{'no-parking': currentElementMsg.sourceType === 4 || currentElementMsg.sourceType === 3}">
            <el-scrollbar wrap-class="warpper-scrollbar" v-show="currentGroupList.length !==0">
            <el-radio v-for="(item, index) in currentGroupList"
                      class="radio"
                      :key="index"
                      v-model="addAreaForm.sourceId"
                      :label="item.id">{{item.name}}</el-radio>
            </el-scrollbar>
            <no-data size="72px" type="data" v-show="currentGroupList.length ===0"></no-data>
          </div>
        </el-form-item>
        <el-form-item :label="$t(`config.map.dataShow`)"
                      v-if="currentElementMsg.sourceType !== 4 && currentElementMsg.sourceType !== 3"
                      prop="showContent">
          <el-checkbox-group v-model="addAreaForm.showContent">
            <el-checkbox label="showIn">{{showIn}}</el-checkbox>
            <el-checkbox label="showOut">{{showOut}}</el-checkbox>
            <el-checkbox label="showHave">{{$t(`config.map.installationBase`)}}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer"
           class="dialog-footer">
        <el-button type="primary"
                   @click="saveAddArea">{{$t(`common.primary`)}}</el-button>
        <el-button @click="addAreaDialog = false">{{$t(`common.cancel`)}}</el-button>
      </div>
    </el-dialog>
    <!-- 地图弹窗-单 -->
    <div id="popup" v-show="mapInitFlag" class="ol-popup" v-if="popup === 'single'">
      <span class="ol-popup-closer h-icon-close-sm" @click="closePopup"></span>
      <div class="ol-popup-title">{{currentElementMsg.elementName}}</div>
      <div class="popup-content">
        <el-button type="text" @click="editElement">{{$t(`common.edit`)}}</el-button>
        <el-button type="text" @click="deleteElement">{{$t(`common.delete`)}}</el-button>
      </div>
    </div>
    <!-- 地图弹窗-多 -->
    <template v-if="popup === 'multi'">
      <div v-show="mapInitFlag" v-for="(item, index) in multiList" :key="index">
       <div ref="item.id" :id="item.id" :key="item.id" class="ol-popup">
         <span class="ol-popup-closer h-icon-close-sm" @click="closePopup2(item.id)"></span>
         <div class="ol-popup-title">{{item.elementName}}</div>
          <div>
            <!-- 客流 -->
            <div v-show="item.sourceType === 2">
              <div class="ol-popup-item" v-show="item.showContent.includes('showIn')">
                <span class="ol-popup-label">{{$t(`analysis.map.peopleEnterNum`)}}</span>
                <span class="ol-popup-content">{{item.inCount}}</span>
              </div>
              <div class="ol-popup-item" v-show="item.showContent.includes('showOut')">
                <span class="ol-popup-label">{{$t(`analysis.map.peopleLeaveNum`)}}</span>
                <span class="ol-popup-content">{{item.outCount}}</span>
              </div>
              <div class="ol-popup-item" v-show="item.showContent.includes('showHave')">
                <span class="ol-popup-label">{{$t(`analysis.map.hasNum`)}}</span>
                <span class="ol-popup-content">{{item.haveCount}}</span>
              </div>
              <div class="ol-popup-lineitem" v-show="layerSwitch.insterst && item.interest">
                <span class="ol-popup-content">{{item.interest}}</span>
              </div>
            </div>
            <!--  车流-->
            <div v-show="item.sourceType === 1">
              <div class="ol-popup-item" v-show="item.showContent.includes('showIn')">
                <span class="ol-popup-label">{{$t(`analysis.map.carEnterNum`)}}</span>
                <span class="ol-popup-content">{{item.inCount}}</span>
              </div>
              <div class="ol-popup-item" v-show="item.showContent.includes('showOut')">
                <span class="ol-popup-label">{{$t(`analysis.map.carLeaveNum`)}}</span>
                <span class="ol-popup-content">{{item.outCount}}</span>
              </div>
              <div class="ol-popup-item" v-show="item.showContent.includes('showHave')">
                <span class="ol-popup-label">{{$t(`analysis.map.hasNum`)}}</span>
                <span class="ol-popup-content">{{item.haveCount}}</span>
              </div>
            </div>
            <!-- 密度 -->
            <div v-show="item.sourceType === 3">
              <div class="ol-popup-item">
                <span class="ol-popup-label">{{$t(`analysis.map.densityNum`)}}</span>
                <span class="ol-popup-content">{{item.density}}</span>
              </div>
            </div>
            <!-- 停车场 -->
            <div v-show="item.sourceType === 4">
              <div class="ol-popup-item">
                <span class="ol-popup-label">{{$t(`analysis.map.parkingLeft`)}}</span>
                <span class="ol-popup-content" :title="`${item.leftCount}/${item.allCount}`">{{item.leftCount}}/{{item.allCount}}</span>
              </div>
            </div>
          </div>
       </div>
      </div>
    </template>
    <!-- 推送 -->
    <message-push @onmessage="onmessage" v-if="hasWs && wsFlag" :URL="URL"></message-push>
  </div>
</template>

<script>
import MapManager from '../../map/MapManager'
import MapContant from '../../map/MapContant'
import api from '../../api/api'
import selectMap from '../../components/select-map/select-map'
import {Loading} from 'hui'
import messagePush from '../../components/webSocket/message-push'
import noData from '../../components/no-data/no-data'
export default {
  name: 'omap',
  props: {
    toolbars: {
      type: Array,
      default () {
        return []
      }
    },
    hasWs: Boolean,
    popup: {
      type: String,
      default: 'single'
    }
  },
  components: {
    selectMap,
    messagePush,
    noData
  },
  data () {
    return {
      baseURL: 'ws://host/oams/webSocket/mapService/v1/mapData/', // url前缀
      noDataFlag: false,
      URL: '', // 推送地址
      wsFlag: false, // 开启推送
      mapConfig: null, // 当前地图的配置
      multiList: [], // 多弹窗数据
      multiDom: {}, // 多弹窗id节点
      map: null, // 地图
      mapInitFlag: false, // 地图初始化完成，用于显示工具栏
      drawSelectFlag: false, // 绘制下拉框
      drawSelectList: [{
        name: this.$t(`config.map.passengerStatistics`),
        id: 2
      }, {
        name: this.$t(`config.map.trafficStatistics`),
        id: 1
      }, {
        name: this.$t(`config.map.passengerDensity`),
        id: 3
      }, {
        name: this.$t(`config.map.parking`),
        id: 4
      }], // 绘制下拉框数组
      currentDraw: {
        name: this.$t(`config.map.passengerStatistics`),
        id: 2
      }, // 当前绘制项
      dialogTitleMap: {
        add: {
          1: this.$t(`config.map.addTrafficStatistics`),
          2: this.$t(`config.map.addPassengerStatistics`),
          3: this.$t(`config.map.addPassengerDensity`),
          4: this.$t(`config.map.addParkingStatistics`)
        },
        edit: {
          1: this.$t(`config.map.editTrafficStatistics`),
          2: this.$t(`config.map.editPassengerStatistics`),
          3: this.$t(`config.map.editPassengerDensity`),
          4: this.$t(`config.map.editParkingStatistics`)
        }
      }, // 弹窗标题
      currentElementMsg: {
        type: '', // 绘制的点线面类型
        feature: null, // 图层元素
        code: '', // 图层编码
        wsCode: '', // 工作空间
        points: [], // 坐标点
        elementId: '', // 元素id
        sourceType: '', // 客流车流type
        sourceId: '', // 关联统计组id
        elementName: '', // 当前图层name
        popPosition: []
      }, // 当前元素信息存储
      layerFlag: false, // 图层选择
      layerSwitch: {
        traffic: true, // 车流
        density: true, // 密度
        passenger: true, // 车流
        insterst: false, // 兴趣分析
        allGroup: true, // 全局组
        parking: true // 停车场
      }, // 图层集合
      allLayersMap: {
        1: {
          Point: 'traffic_statistics_dot_layer',
          LineString: 'traffic_statistics_line_layer',
          Polygon: 'traffic_statistics_area_layer'
        },
        2: {
          Point: 'passenger_statistics_dot_layer',
          LineString: 'passenger_statistics_line_layer',
          Polygon: 'passenger_statistics_area_layer'
        },
        3: {
          Point: 'passenger_density_dot_layer',
          LineString: 'passenger_density_line_layer',
          Polygon: 'passenger_density_area_layer'
        },
        4: {
          Point: 'parking_layer'
        }
      }, // 所有图层映射关系
      mapList: [], // 地图列表
      addAreaDialog: false, // 添加弹窗标志位
      removeFlag: false, // 删除标志位
      addAreaForm: {
        elementName: '', // 区域名称
        sourceId: '', // 统计组
        showContent: [] // 数据展示
      }, // 添加区域表单
      rules: {
        elementName: [{ required: true, message: this.$t(`validate.areainputRequired`), trigger: 'blur' }],
        sourceId: [{ required: true, message: this.$t(`validate.groupRequired`), trigger: 'change' }],
        showContent: [{ required: true, message: this.$t(`validate.dataRequired`), trigger: 'change', type: 'array' }]
      },
      currentGroupList: [], // 当前统计组的列表
      mapFlag: true,
      loadingInstance: null,
      allLayerData: null,
      popupElement: null,
      isAdd: true, // 用于判断弹窗是编辑还是添加状态
      fullScreenFlag: false, // 全屏标志位
      globalData: {
        totalHavePassengersCount: '', // 保有量
        totalInPassengersCount: '', // 总进入
        totalOutPassengersCount: '' // 总离开
      }, // 全局组信息
      stateType: {
        1: '',
        2: 'pre_alarm',
        3: 'alarm'
      }
    }
  },
  computed: {
    // 添加区域标题
    addAreaTitle () {
      return this.isAdd ? this.dialogTitleMap.add[this.currentElementMsg.sourceType] : this.dialogTitleMap.edit[this.currentElementMsg.sourceType]
    },
    showIcon () {
      return this.layerFlag ? 'icon-b_ic_up_s' : 'icon-b_ic_down_s'
    },
    areaSelectIcon () {
      return this.drawSelectFlag ? 'icon-b_ic_up_s' : 'icon-b_ic_down_s'
    },
    fullScreenIcon () {
      return this.fullScreenFlag ? 'icon-b_ic_qphy' : 'icon-b_ic_quanping'
    },
    associateArea () {
      return this.currentElementMsg.sourceType !== 4 ? this.$t(`config.map.associateGroup`) : this.$t(`config.map.associateparking`)
    },
    showIn () {
      if (this.currentElementMsg.sourceType === 1) {
        return this.$t(`config.map.enterInCar`)
      } else {
        return this.$t(`config.map.enterInNum`)
      }
    },
    showOut () {
      if (this.currentElementMsg.sourceType === 1) {
        return this.$t(`config.map.leaveOutCar`)
      } else {
        return this.$t(`config.map.leaveOutNum`)
      }
    }
  },
  watch: {
    'layerSwitch.traffic' (val) {
      let layers = ['traffic_statistics_dot_layer', 'traffic_statistics_line_layer', 'traffic_statistics_area_layer']
      this.changeLayerShow(layers, val)
    },
    'layerSwitch.density' (val) {
      let layers = ['passenger_density_dot_layer', 'passenger_density_line_layer', 'passenger_density_area_layer']
      this.changeLayerShow(layers, val)
    },
    'layerSwitch.passenger' (val) {
      let layers = ['passenger_statistics_dot_layer', 'passenger_statistics_line_layer', 'passenger_statistics_area_layer']
      this.changeLayerShow(layers, val)
    },
    'layerSwitch.parking' (val) {
      let layers = ['parking_layer']
      this.changeLayerShow(layers, val)
    }
  },
  mounted () {
    this.initMap(true)
  },
  methods: {
    // 初始化地图,初始化还是切换地图
    async initMap (flag) {
      this.loadingInstance = Loading.service({fullscreen: true, text: this.$t(`common.loading`)})
      if (flag) {
        await this.getMapConfig()
      }
      this.allLayerData = null
      // 初始化地图
      if (this.mapConfig) {
        this.getMapMsg()
        this.map = new MapManager({
          map: {
            workspace: this.mapConfig.workspace,
            map: this.mapConfig.mapCode,
            target: 'map'
          },
          context: {
            sysContext: this.mapConfig.sysContext,
            gisContext: this.mapConfig.gisContext
          },
          sysUrl: {
            tmapUrl: '/yangting/oams/web/tmap',
            featureDataUrl: '/yangting/oams/web/featureData'
          },
          errorFn: () => {
            this.noDataFlag = true
            this.loadingInstance.close()
          }
        })
        this.$nextTick(() => {
          this.setMapEvent()
          this.map.initMap()
        })
      }
    },
    // 获取地图配置
    async getMapConfig () {
      try {
        this.noDataFlag = false
        const result = await api.mapConfig.mapInfos()
        this.mapList = result.data.list || []
        // 设置默认地图
        if (!this.mapConfig) {
          this.mapList.forEach(item => {
            if (item.isDefault === 1) {
              this.mapConfig = item
              if (this.hasWs) {
                this.initWs(item)
              }
            }
          })
        }
      } catch (e) {
        this.$nextTick(() => {
          this.noDataFlag = true
          this.loadingInstance.close()
        })
      }
    },
    // 初始化websock
    initWs (data) {
      this.wsFlag = false
      this.$nextTick(() => {
        this.URL = `${this.baseURL}${data.mapCode}`.replace('host', location.host)
        this.wsFlag = true
      })
    },
    // 消息推送处理
    onmessage (data) {
      let elements = {}
      this.globalData.totalHavePassengersCount = data.totalHavePassengersCount
      this.globalData.totalInPassengersCount = data.totalInPassengersCount
      this.globalData.totalOutPassengersCount = data.totalOutPassengersCount
      data.elements.forEach(item => {
        elements[item.elementId] = item
      })
      this.multiList.forEach(item => {
        let newData = elements[item.id]
        if (newData) {
          item.allCount = newData.allCount
          item.density = newData.density
          item.showContent = newData.showContent.split(',')
          item.haveCount = newData.haveCount
          item.inCount = newData.inCount
          item.leftCount = newData.leftCount
          item.interest = newData.interest ? `${this.$t(`analysis.interest.welcome`)}${this.$t(`analysis.interest.${newData.interest}`)}` : ''
          item.outCount = newData.outCount
          item.elementName = newData.elementName
          if (item.state !== newData.state) {
            // 状态不一致时，切换
            item.state = newData.state
            this.changeLayerData(item)
          }
        }
      })
    },
    // 设置地图事件监听
    setMapEvent () {
      // 视图加载完成后续操作
      this.map.on(MapContant.setViewSuccess, () => {
        this.$nextTick(async () => {
          this.map.addChangeResolution()
          this.mapInitFlag = true
          // 设置默认中心点和尺寸
          this.setHome()
          // 加载地图鼠标事件
          this.map.addMapClickListen()
          if (this.popup === 'multi') {
            if (this.multiList.length === 0) {
              await this.getMapMsg()
            }
            this.map.addMultiOverlay(this.multiList, this.multiDom)
          }
        })
      })
      // 绘制区域完成事件回调
      this.map.on(MapContant.drawEnd, data => {
        this.map.removeDraw()
        this.currentElementMsg.feature = data.param
        this.currentElementMsg.points = data.points
        this.currentElementMsg.popPosition = data.coordinate
        // 检测绘制是否正确
        if (!this.checkPoint(data.points)) {
          return
        }
        this.isAdd = true
        this.addAreaDialog = true
      })
      // 监听地图鼠标事件
      this.map.on(MapContant.mapClick, data => {
        let id = data.param.feature.getProperties().elementId
        if (this.popup === 'single') {
          let Properties = data.param.feature.getProperties()
          this.currentElementMsg.code = data.param.code
          this.currentElementMsg.feature = data.param.feature
          this.currentElementMsg.elementId = id
          this.currentElementMsg.sourceId = Properties.sourceId
          this.currentElementMsg.elementName = Properties.elementName
          this.currentElementMsg.sourceType = Properties.sourceType
          if (!this.popupElement) {
            this.popupElement = document.getElementById('popup')
          }
          this.map.showOverlay(this.popupElement, data.param.point)
        } else if (this.popup === 'multi' && this.multiDom[id] && !this.multiDom[id].show) {
          this.multiDom[id].show = true
          this.map.setOverlayById(id, data.param.point)
        }
      })
      // 矢量图层加载完毕回调
      this.map.on(MapContant.loadVectorLayerSuccess, data => {
        this.setLayerData(true)
        this.$nextTick(() => {
          this.loadingInstance.close()
        })
        this.map.initOverlay()
      })
      // 监听地图缩放事件，用于调整地图上图片的大小
      this.map.on(MapContant.zoomEnd, async data => {
        // let code
        let scale = data.param.zoom
        if (this.multiList.length === 0) {
          await this.getMapMsg()
        }
        Object.keys(this.allLayerData).forEach(item => {
          if (this.allLayerData[item].features.length !== 0 && this.allLayerData[item].features[0].geometry.type === 'Point') {
            this.map.updateScale(item, this.mapConfig.workspace, scale)
          }
        })
      })
    },
    // 获取地图元素
    async getMapMsg () {
      let data = {
        params: {
          mapcode: this.mapConfig.mapCode
        }
      }
      try {
        let res
        let elementList
        if (this.popup === 'single') {
          res = await api.mapConfig.getMapMsg(data)
          elementList = res.data.list
        } else {
          res = await api.mapConfig.getShowData(data)
          elementList = res.data.elements
          this.globalData.totalHavePassengersCount = res.data.totalHavePassengersCount
          this.globalData.totalInPassengersCount = res.data.totalInPassengersCount
          this.globalData.totalOutPassengersCount = res.data.totalOutPassengersCount
        }
        this.allLayerData = this.dealElement(elementList)
      } catch (e) {
        this.$nextTick(() => {
          this.loadingInstance.close()
        })
      }
    },
    // 设置图层信息 是否绘制所有的图层
    async setLayerData (allFlag, layerData) {
      // 查看图层元素是否已经获取
      if (!this.allLayerData) {
        await this.getMapMsg()
      }
      if (this.allLayerData && allFlag) {
        Object.keys(this.allLayerData).forEach(item => {
          if (this.allLayerData[item].features.length !== 0) {
            this.map.addFeature(item, this.mapConfig.workspace, this.allLayerData[item])
          }
        })
      } else if (this.allLayerData) {
        Object.keys(this.allLayerData).forEach(item => {
          if (layerData.includes(item) && this.allLayerData[item].features.length !== 0) {
            this.map.addFeature(item, this.mapConfig.workspace, this.allLayerData[item])
          }
        })
      }
    },
    // 获取当前未关联统计组和当前已关联的统计组集合
    getGroupList (areaId) {
      let data = {
        params: {
          areaId: areaId || ''
        }
      }
      if (this.currentElementMsg.sourceType === 1) {
        // 获取车流统计组
        api.mapConfig.getVehicleAreas(data).then(res => {
          this.currentGroupList = res.data.list
        })
      } else if (this.currentElementMsg.sourceType === 2) {
        // 获取客流统计组
        api.mapConfig.getPassengerAreas(data).then(res => {
          this.currentGroupList = res.data.list
        })
      } else if (this.currentElementMsg.sourceType === 3) {
        // 获取客流密度统计组
        api.mapConfig.getDensityAreas(data).then(res => {
          this.currentGroupList = res.data.list
        })
      } else if (this.currentElementMsg.sourceType === 4) {
        // 获取停车场统计组
        let parkingdata = {}
        if (areaId) {
          parkingdata = {
            params: {
              parkingId: areaId
            }
          }
        }
        api.mapConfig.getParkingsAreas(parkingdata).then(res => {
          this.currentGroupList = res.data.list
        })
      }
    },
    // 添加地图成功事件，更新地图列表
    addMapSuccess () {
      this.getMapConfig()
    },
    // 删除地图
    removeMap (item) {
      let data = {
        path: {
          mapcode: item.mapCode
        }
      }
      api.mapConfig.removeMap(data).then(() => {
        this.$message.success(this.$t(`common.deleteSuccess`))
        this.getMapConfig()
      })
    },
    // 切换地图
    changeMap (item) {
      // 需要先摧毁页面，才能切换页面
      this.mapFlag = false
      this.popupElement = null
      this.$nextTick(() => {
        this.mapFlag = true
        this.mapConfig = item
        if (this.hasWs) {
          // 重置websock和图层
          this.initWs(item)
          this.layerSwitch = {
            traffic: true,
            density: true,
            passenger: true,
            insterst: false,
            allGroup: true,
            parking: true
          }
        }
        this.initMap()
      })
    },
    // 设置默认地图
    setDefaultMap (item) {
      let data = {
        path: {
          mapcode: item.mapCode
        }
      }
      api.mapConfig.setDefaultMap(data).then(() => {
        this.$message.success(this.$t(`common.setSuccess`))
        this.getMapConfig()
      })
    },
    removeFeature (code, wsCode, feature, elementId) {
      let data = {
        path: {
          elementId
        }
      }
      api.mapConfig.removeMapMsg(data).then(() => {
        this.$message.success(this.$t(`common.deleteSuccess`))
        this.map.removeFeature(code, wsCode, feature)
      })
    },
    // 检测绘制的点是否可行,线必须至少2个不同的点，面至少不同的3个点
    checkPoint (data) {
      let points = []
      if (this.currentElementMsg.type === 'LineString') {
        // 线至少2个点
        data.forEach(item => {
          points.push(item.join(','))
        })
        if (new Set(points).size < 2) {
          this.$nextTick(() => {
            this.map.removeFeature(this.currentElementMsg.code, this.currentElementMsg.wsCode, this.currentElementMsg.feature)
          })
          this.$message.info(this.$t(`common.draw_line`))
          return false
        }
      } else if (this.currentElementMsg.type === 'Polygon') {
        data[0].forEach(item => {
          points.push(item.join(','))
        })
        // 面至少3个点
        if (new Set(points).size < 3) {
          this.$nextTick(() => {
            this.map.removeFeature(this.currentElementMsg.code, this.currentElementMsg.wsCode, this.currentElementMsg.feature)
          })
          this.$message.info(this.$t(`common.draw_area`))
          return false
        }
      }
      return true
    },
    // 设置默认中心点和层级
    setHome () {
      this.mapConfig.zoomLevel && this.map.setLevel(this.mapConfig.zoomLevel)
      this.mapConfig.centerPoint && this.map.setCenter(this.mapConfig.centerPoint.split(','))
    },
    // 获取当前中心点和层级并保存
    getHome () {
      this.mapConfig.zoomLevel = this.map.getLevel()
      this.mapConfig.centerPoint = this.map.getCenter().join(',')
      let data = {
        data: {
          zoomLevel: this.mapConfig.zoomLevel,
          centerPoint: this.mapConfig.centerPoint
        },
        path: {
          mapcode: this.mapConfig.mapCode
        }
      }
      api.mapConfig.setHome(data).then(() => {
        this.$message.success(this.$t(`common.setSuccess`))
      })
    },
    // 放大地图
    zoomOut () {
      this.map.zoomTool.zoomOut()
    },
    // 缩小地图
    zoomIn () {
      this.map.zoomTool.zoomIn()
    },
    // 绘制下拉框切换
    changeDrawSelect () {
      this.drawSelectFlag = !this.drawSelectFlag
    },
    // 图层下拉切换
    changeLayer () {
      this.layerFlag = !this.layerFlag
    },
    // 绘制区域,type: 点：Point, 线：LineString， 面：Polygon
    drwaArea (type) {
      // 先清空绘制
      this.map.removeDrawing()
      this.$nextTick(() => {
        let wsCode = this.mapConfig.workspace
        let code = this.allLayersMap[this.currentDraw.id][type]
        // 设置当前绘制区域编码和
        this.currentElementMsg.code = code
        this.currentElementMsg.wsCode = wsCode
        this.currentElementMsg.type = type
        this.currentElementMsg.sourceType = this.currentDraw.id
        // 获取当前未关联的统计组
        this.getGroupList()
        // 设置当前绘制图层编码和工作空间
        this.map.setCurrent(code, wsCode)
        // 开始绘制区域
        this.removeFlag = true
        this.map.draw(code, wsCode, type)
      })
    },
    // 保存添加区域弹窗
    saveAddArea () {
      this.$refs.form.validate(value => {
        if (value) {
          if (this.isAdd) {
            let data = {
              data: {
                elementName: this.addAreaForm.elementName,
                sourceId: this.addAreaForm.sourceId,
                showContent: this.addAreaForm.showContent.join(','),
                shape: this.currentElementMsg.type,
                mapCode: this.mapConfig.mapCode,
                pointSet: JSON.stringify(this.currentElementMsg.points),
                sourceType: this.currentDraw.id,
                popPosition: JSON.stringify(this.currentElementMsg.popPosition)
              }
            }
            // 添加状态
            api.mapConfig.addMapMsg(data).then(res => {
              this.map.drawing = false
              // 把元素id和统计组id放到图层属性
              this.currentElementMsg.feature.setProperties({
                elementId: res.data,
                sourceId: this.addAreaForm.sourceId,
                elementName: this.addAreaForm.elementName,
                sourceType: this.currentElementMsg.sourceType
              })
              this.$message.success(this.$t(`common.addSuccess`))
              this.removeFlag = false
              this.addAreaDialog = false
            })
          } else {
            // 更新内容
            let data = {
              data: {
                elementName: this.addAreaForm.elementName,
                sourceId: this.addAreaForm.sourceId,
                showContent: this.addAreaForm.showContent.join(',')
              },
              path: {
                elementId: this.currentElementMsg.elementId
              }
            }
            api.mapConfig.updateMapMsg(data).then(res => {
              this.map.drawing = false
              this.$message.success(this.$t(`common.editSuccess`))
              this.currentElementMsg.sourceId = this.addAreaForm.sourceId
              this.removeFlag = false
              this.addAreaDialog = false
            })
          }
        }
      })
    },
    // 关闭弹窗操作
    closeDialog () {
      this.addAreaForm = {
        elementName: '',
        sourceId: '',
        showContent: []
      }
      this.map.drawing = false
      // 清除绘制图层
      if (this.removeFlag) {
        this.map.removeFeature(this.currentElementMsg.code, this.currentElementMsg.wsCode, this.currentElementMsg.feature)
      }
      this.$nextTick(() => {
        this.$refs.form.resetValidates()
      })
    },
    // 处理点线面，转换成地图需要的geojson格式
    dealElement (data) {
      let geodata = {
        traffic_statistics_dot_layer: {
          type: 'FeatureCollection',
          features: []
        },
        traffic_statistics_line_layer: {
          type: 'FeatureCollection',
          features: []
        },
        traffic_statistics_area_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_statistics_dot_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_statistics_line_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_statistics_area_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_density_dot_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_density_line_layer: {
          type: 'FeatureCollection',
          features: []
        },
        passenger_density_area_layer: {
          type: 'FeatureCollection',
          features: []
        },
        parking_layer: {
          type: 'FeatureCollection',
          features: []
        }
      }
      this.multiList = []
      let dialogData
      data.forEach(item => {
        geodata[this.allLayersMap[item.sourceType][item.shape]].features.push({
          type: 'Feature',
          geometry: {
            type: item.shape,
            coordinates: JSON.parse(item.pointSet)
          },
          properties: {
            elementId: item.elementId,
            sourceId: item.sourceId,
            type: this.stateType[item.state],
            elementName: item.elementName,
            sourceType: item.sourceType
          }
        })
        dialogData = {
          id: item.elementId,
          haveCount: item.haveCount, // 保有量
          inCount: item.inCount, // 进入人数
          allCount: item.allCount, // 所有人数
          density: item.density, // 密度
          leftCount: item.leftCount, //
          showContent: item.showContent.split(','),
          interest: item.interest,
          outCount: item.outCount, // 离开人数
          sourceType: item.sourceType,
          shape: item.shape, // 图层的样式
          state: item.state, // 图层的样式，用于比较是否需要切换
          elementName: item.elementName, // 弹窗姓名
          coordinate: JSON.parse(item.popPosition)
        }
        dialogData.interest = item.interest ? `${this.$t(`analysis.interest.welcome`)}${this.$t(`analysis.interest.${item.interest}`)}` : '' // 兴趣分析，多语言转换
        this.multiList.push(dialogData)
      })
      return geodata
    },
    // 编辑图层元素信息
    editElement () {
      this.getGroupList(this.currentElementMsg.sourceId)
      let data = {
        path: {
          elementId: this.currentElementMsg.elementId
        }
      }
      api.mapConfig.getMagElementMsg(data).then(res => {
        this.addAreaForm.elementName = res.data.elementName
        this.addAreaForm.sourceId = res.data.sourceId
        this.addAreaForm.showContent = res.data.showContent.split(',')
        this.isAdd = false
        this.removeFlag = false
        this.addAreaDialog = true
      })
    },
    // 删除图层元素信息
    deleteElement () {
      this.$confirm(this.$t(`common.deleteAreaTips`), this.$t(`common.tips`), {
        confirmButtonText: this.$t(`common.primary`),
        cancelButtonText: this.$t(`common.cancel`),
        type: 'question'
      }).then(() => {
        this.closePopup()
        this.removeFeature(this.currentElementMsg.code, this.mapConfig.workspace, this.currentElementMsg.feature, this.currentElementMsg.elementId)
      }).catch(() => {
      })
    },
    // 关闭弹窗
    closePopup () {
      this.map.removeOverlay()
    },
    // 多弹窗的关闭
    closePopup2 (id) {
      this.multiDom[id].show = false
      this.map.claseOverlayById(id)
    },
    // 控制图层显隐
    changeLayerShow (layers, val) {
      Object.keys(this.allLayerData).forEach(item => {
        if (layers.includes(item) && this.allLayerData[item].features.length !== 0) {
          this.map.setLayerVisiable(item, this.mapConfig.workspace, val)
          this.allLayerData[item].features.forEach(feature => {
            if (!val) {
              this.closePopup2(feature.properties.elementId)
            } else {
              let currentFeature = (this.multiList.find((element) => {
                return feature.properties.elementId === element.id
              }))
              this.map.setOverlayById(feature.properties.elementId, currentFeature.coordinate)
            }
          })
        }
      })
    },
    // 控制数据更新和图层样式的更新
    changeLayerData (data) {
      let feature = this.map.getFeature(this.allLayersMap[data.sourceType][data.shape], this.mapConfig.workspace, data.id)
      let type = this.stateType[data.state]
      feature.setProperties({type})
    },
    fullScreen () {
      this.fullScreenFlag = !this.fullScreenFlag
      this.$emit('full-screen', this.fullScreenFlag)
    },
    // 地图右击取消绘制
    rightClick () {
      if (this.map.drawing) {
        this.map.removeDrawing()
      }
    }
  }
}
</script>

<style lang="less" scoped>
@import url("../../assets/styles/var.less");
.map-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  .map {
    width: 100%;
    height: 100%;
  }
  .top-right {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    height: 32px;
    .icon-32 {
      margin-left: 14px;
    }
    .dram-area-warpper {
      position: relative;
      display: inline-block;
      width: 132px;
      height: 32px;
      margin-left: 14px;
      vertical-align: top;
      .dram-area {
        display: inline-block;
        width: 100%;
        line-height: 32px;
        height: 32px;
        cursor: pointer;
        background-color: @bg-color-3;
        box-shadow: 0 1px 4px 0 @box-shadow-color-1;
        border-radius: 2px;
        box-sizing: border-box;
        padding: 0 8px;
        .dram-area-text{
          display: inline-block;
          width: 75px;
          box-sizing: border-box;
          vertical-align: top;
          padding-left: 4px;
        }
      }
      .dram-area-content {
        position: absolute;
        z-index: 10;
        top: 36px;
        width: 132px;
        height: 128px;
        box-sizing: border-box;
        background-color: @bg-color-3;
        box-shadow: 0 1px 4px 0 @box-shadow-color-1;
        border-radius: 2px;
        .icon-32 {
          margin-left: 0;
        }
        /deep/ .page-ellipsis {
          height: 32px;
          line-height: 32px;
        }
        /deep/ label {
          height: 32px;
          line-height: 32px;
          width: 100%;
          margin-left: 0;
        }
        .dram-area-type {
          position: absolute;
          top: 0;
          left: 150px;
          z-index: 10;
          height: 96px;
          .icon-area,
          .icon-line,
          .icon-dot {
            margin-bottom: 4px;
          }
        }
      }
    }
    .show-layer-warpper {
      position: relative;
      display: inline-block;
      width: 132px;
      box-sizing: border-box;
      padding: 0 8px;
      height: 32px;
      margin-left: 14px;
      cursor: pointer;
      background-color: @bg-color-3;
      box-shadow: 0 1px 4px 0 @box-shadow-color-1;
      border-radius: 2px;
      vertical-align: top;
      .show-layer {
        display: inline-block;
        width: calc(~"100% - 40px");
        line-height: 32px;
        height: 32px;
      }
      .show-layer-content {
        position: absolute;
        z-index: 10;
        top: 40px;
        left: 0;
        width: 132px;
        height: 196px;
        box-sizing: border-box;
        padding-left: 12px;
        background-color: @bg-color-3;
        box-shadow: 0 1px 4px 0 @box-shadow-color-1;
        border-radius: 2px;
        .el-checkbox {
          height: 32px;
          line-height: 32px;
          width: 100%;
          margin-left: 0;
        }
      }
    }
  }
  .icon-32 {
    display: inline-block;
    width: 32px;
    height: 32px;
    font-size: 16px;
    text-align: center;
    line-height: 32px;
    cursor: pointer;
    background-color: @bg-color-3;
    box-shadow: 0 1px 4px 0 @box-shadow-color-1;
    border-radius: 2px;
  }
  .bottom-right {
    position: absolute;
    bottom: 16px;
    right: 16px;
    z-index: 10;
    width: 32px;
    .icon-32-group {
      position: relative;
      display: inline-block;
      box-shadow: 0 1px 4px 0 @box-shadow-color-1;
      border-radius: 2px;
      margin-top: 8px;
      .split-line {
        position: absolute;
        left: 8px;
        width: 16px;
        border-top: 1px solid rgba(0, 0, 0, 0.12);
      }
      .icon-32 {
        margin-top: 0;
      }
    }
    .icon-32 {
      margin-top: 8px;
      border-radius: 0;
    }
  }
  .bottom-left{
    position: absolute;
    bottom: 16px;
    left: 16px;
    z-index: 10;
    height: 32px;
    line-height: 32px;
    .traffic-legend,
    .passenger-legend,
    .density-legend,
    .pre-legend,
    .alarm-legend{
      color: @font-color-3;
      padding: 0 16px 0 16px;
      text-shadow: 0 1px @bg-color-3, 1px 0 @bg-color-3, -1px 0 @bg-color-3, 0 -1px @bg-color-3;
    }
    .traffic-legend{
      background: url('../../assets/images/ic_tuli_p.png') no-repeat 0 4px;
    }
    .passenger-legend{
      background: url('../../assets/images/ic_tuli_b.png') no-repeat 0 4px;
    }
    .density-legend{
      background: url('../../assets/images/ic_tuli_green.png') no-repeat 0 4px;
    }
    .pre-legend{
      background: url('../../assets/images/ic_tuli_o.png') no-repeat 0 4px;
    }
    .alarm-legend{
      background: url('../../assets/images/ic_tuli_r.png') no-repeat 0 4px;
    }
  }
  .top-left{
    position: absolute;
    top: 16px;
    left: 16px;
    z-index: 10;
    height: 32px;
    line-height: 32px;
    background-color: @bg-color-5;
    border-radius: 2px;
    box-shadow: 0 -1px 4px 0 @box-shadow-color-1;
    display: flex;
    color: @font-color-1;
    padding: 0 8px;
    .num-light{
      font-size: 12px;
      padding: 0 4px;
    }
    .num-weight{
      font-size: 14px;
      font-weight: bold;
    }
    .allin-num, .allout-num{
      display: inline-block;
      display: flex;
      padding-right: 12px;
      &::after{
        position: relative;
        content: '';
        left: 4px;
        top: 10px;
        width: 0px;
        height: 12px;
        border-right: 1px solid @border-color-3;
      }
    }
    .has-num{
      display: inline-block;
      display: flex;
    }
  }
}
.add-area-form {
  padding-top: 24px;
  .select-group {
    width: 100%;
    height: 196px;
    box-sizing: border-box;
    padding: 16px;
    border: 1px solid @boder-color-2;
    border-radius: 2px;
    overflow: auto;
    &.no-parking{
      height: 260px;
    }
    /deep/ .el-radio {
      margin-left: 0;
      display: block;
    }
  }
}
</style>
