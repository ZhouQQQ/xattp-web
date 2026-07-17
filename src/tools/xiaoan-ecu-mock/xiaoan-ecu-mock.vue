<template>
  <div class="xiaoan-ecu-mock">
    <div class="card-wrap" :class="{ 'card-wrap-reporting': connectId }">
      <n-card>
        <div class="form-section">
          <div v-if="existingMockList.length > 0" class="existing-tabs-wrap">
            <div class="existing-tabs-title">已有模拟连接</div>
            <n-tabs v-model:value="activeExistingMockImei" type="line" size="small"
              @update:value="handleExistingMockTabChange">
              <n-tab-pane v-for="item in existingMockList" :key="item.imei" :name="item.imei" :tab="item.imei" />
            </n-tabs>
          </div>
          <n-form :model="formData" label-placement="left" label-width="100px">
            <n-grid :cols="12" :x-gap="1" :y-gap="2">
              <!-- 第一行：环境、租户ID、服务区（服务区宽一点） -->
              <n-gi :span="4">
                <n-form-item label="环境" path="env" required>
                  <n-select v-model:value="formData.env" :options="envOptions" placeholder="请选择环境" clearable
                    size="small" :disabled="!!connectId" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="3">
                <n-form-item label="租户ID" path="tenant_id" required>
                  <n-input :value="formData.tenant_id" placeholder="请输入租户 ID" clearable size="small"
                    :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" style="width: 100%"
                    @update:value="onTenantIdInput" />
                </n-form-item>
              </n-gi>
              <n-gi :span="5">
                <n-form-item path="service_area">
                  <template #label>
                    <span>服务区</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      非必填。可切换输入名称或ID，若填写将自动绑定车辆并上架该服务区
                    </n-tooltip>
                  </template>
                  <div class="service-area-block">
                    <div class="service-area-row">
                      <n-select v-model:value="formData.serviceAreaInputMode" :options="serviceAreaInputModeOptions"
                        size="small" :disabled="!!connectId" @update:value="onServiceAreaInputModeChange"
                        class="service-area-type-select" />
                      <n-input v-if="formData.serviceAreaInputMode === 'name'" v-model:value="formData.service_area_name"
                        placeholder="选填，服务区名称" clearable size="small" :readonly="!!connectId"
                        :class="{ 'input-readonly-gray': connectId }" class="service-area-input" />
                      <n-input v-else v-model:value="formData.service_area_id" placeholder="选填，服务区ID" clearable
                        size="small" :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }"
                        class="service-area-input" />
                    </div>
                    <div v-if="connectId && carId" class="car-id-hint" title="模拟绑定的车辆号，可复制">
                      车辆号 {{ carId }}
                    </div>
                  </div>
                </n-form-item>
              </n-gi>
              <!-- 第二行：IMEI、参考IMEI -->
              <n-gi :span="6">
                <n-form-item label="IMEI" path="imei" required>
                  <div class="imei-field">
                    <div class="imei-row">
                      <n-input v-model:value="formData.imei" placeholder="IMEI（15 位数字，以 86 开头）" clearable size="small"
                        :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" />
                      <n-tooltip trigger="hover">
                        <template #trigger>
                          <n-button type="default" size="small" :disabled="!!connectId" @click="randomImei">
                            <template #icon>
                              <n-icon :component="Dice" :size="18" />
                            </template>
                            随机
                          </n-button>
                        </template>
                        随机生成
                      </n-tooltip>
                    </div>
                    <div class="imei-warn-tip">请不要使用真实存在的 IMEI，以免影响真实设备</div>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item path="ref_imei">
                  <template #label>
                    <span>参考IMEI</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      选填。请确保该IMEI真实存在并且在线，如填入将参考此IMEI模拟其透传返回
                    </n-tooltip>
                  </template>
                  <n-input v-model:value="formData.ref_imei" placeholder="选填，15 位数字" clearable size="small"
                    :readonly="!!connectId" :class="{ 'input-readonly-gray': connectId }" style="width: 100%"
                    :maxlength="15" show-count />
                </n-form-item>
              </n-gi>
              <!-- 第三行：经度、纬度、操作按钮同一行 -->
              <n-gi :span="12">
                <n-grid :cols="24" :x-gap="8">
                  <n-gi :span="8">
                    <n-form-item path="lng">
                      <template #label>
                        <span>经度(GCJ02)</span>
                      </template>
                      <n-input-number v-model:value="formData.lng" placeholder="经度" size="small" clearable
                        :show-button="false" style="width: 100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi :span="8">
                    <n-form-item path="lat">
                      <template #label>
                        <span>纬度(GCJ02)</span>
                      </template>
                      <n-input-number v-model:value="formData.lat" placeholder="纬度" size="small" clearable
                        :show-button="false" style="width: 100%" />
                    </n-form-item>
                  </n-gi>
                  <n-gi :span="8">
                    <n-form-item label=" ">
                      <div class="coord-actions-row">
                        <n-button size="small" type="default" @click="showCoordPicker = true">
                          坐标选取
                        </n-button>
                        <n-button size="small" type="default" title="重置经纬度到武汉留学生创业园" @click="resetDefaultCoords">
                          重置经纬度
                        </n-button>
                      </div>
                    </n-form-item>
                  </n-gi>
                </n-grid>
              </n-gi>
              <!-- 剩余每行2个 -->
              <n-gi :span="6">
                <n-form-item label="电压（v）" path="voltage">
                  <n-input-number v-model:value="formData.voltage" placeholder="默认 55" size="small" :min="0"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item path="version">
                  <template #label>
                    <span>版本号</span>
                    <n-tooltip trigger="hover" style="margin-left: 4px;">
                      <template #trigger>
                        <n-icon :component="Help" :size="14" class="tip-icon" />
                      </template>
                      仅在开始模拟实时生效，更新数据 需要 设备复位或重启后生效
                    </n-tooltip>
                  </template>
                  <n-input v-model:value="formData.version" placeholder="默认 1.2.3" clearable size="small"
                    style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="电池SN" path="battery_sn">
                  <n-input
                    v-model:value="formData.battery_sn"
                    placeholder="选填，可清除"
                    clearable
                    size="small"
                    style="width: 100%"
                  />
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="电池SOC" path="battery_soc">
                  <div class="battery-soc-row">
                    <n-slider
                      v-model:value="formData.battery_soc"
                      :min="0"
                      :max="100"
                      :step="1"
                      size="small"
                      :disabled="!formData.battery_sn?.trim()"
                      style="flex: 1"
                    />
                    <n-input-number
                      v-model:value="formData.battery_soc"
                      :min="0"
                      :max="100"
                      :show-button="false"
                      size="small"
                      style="width: 72px"
                      placeholder="SOC"
                      :disabled="!formData.battery_sn?.trim()"
                    />
                    <span class="soc-unit">%</span>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="电源状态" path="power_exists">
                  <n-space :size="8" align="center">
                    <span class="switch-label">断开</span>
                    <n-switch v-model:value="formData.power_exists" size="small" />
                    <span class="switch-label">连接</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi :span="6">
                <n-form-item label="座舱锁状态" path="seat_locked">
                  <n-space :size="8" align="center">
                    <span class="switch-label">开启</span>
                    <n-switch v-model:value="formData.seat_locked" size="small" />
                    <span class="switch-label">关闭</span>
                  </n-space>
                </n-form-item>
              </n-gi>
              <n-gi :span="12" class="helmet-row" v-show="false">
                <n-space align="center" :size="24">
                  <n-form-item label="模拟头盔" path="has_helmet" label-placement="left">
                    <n-switch v-model:value="formData.has_helmet" size="small" @update:value="onHasHelmetChange" />
                  </n-form-item>
                  <n-form-item label="头盔在位" path="helmet_react" label-placement="left">
                    <n-space :size="8" align="center">
                      <span class="switch-label">否</span>
                      <n-switch v-model:value="formData.helmet_react" size="small" :disabled="!formData.has_helmet" />
                      <span class="switch-label">是</span>
                    </n-space>
                  </n-form-item>
                  <n-form-item label="头盔上锁" path="helmet_lock" label-placement="left">
                    <n-space :size="8" align="center">
                      <span class="switch-label">否</span>
                      <n-switch v-model:value="formData.helmet_lock" size="small" :disabled="!formData.has_helmet" />
                      <span class="switch-label">是</span>
                    </n-space>
                  </n-form-item>
                </n-space>
              </n-gi>
              <!-- TLV 独占一行 -->
              <n-gi :span="12">
                <n-form-item path="tlv">
                  <template #label>
                    <span>TLV数据</span>
                  </template>
                  <div class="tlv-input-row">
                    <n-input v-model:value="formData.tlv" type="textarea" placeholder='选填'
                      :autosize="{ minRows: 4, maxRows: 10 }" clearable size="small" class="tlv-textarea" />
                    <n-space :size="8" class="tlv-btns">
                      <n-button type="default" size="small" class="tlv-ref-btn" @click="insertTlvExample">
                        示例
                      </n-button>
                      <n-button type="default" size="small" class="tlv-ref-btn" @click="openTlvProtocolDoc">
                        参考文档
                      </n-button>
                    </n-space>
                  </div>
                </n-form-item>
              </n-gi>
            </n-grid>
            <n-form-item class="form-item-buttons">
              <template v-if="!connectId">
                <n-button type="primary" :loading="createLoading" @click="handleCreate">
                  开始模拟
                </n-button>
              </template>
              <template v-else>
                <n-space :size="8">
                  <n-button type="error" :loading="deleteLoading" @click="handleDisconnect">
                    <template #icon>
                      <n-icon :component="Trash" :size="18" />
                    </template>
                    停止模拟
                  </n-button>
                  <n-button type="default" :loading="updateLoading" @click="handleUpdate">
                    立即更新数据
                  </n-button>
                  <n-button type="default" @click="openMoveModal">
                    手动移动
                  </n-button>
                  <n-button type="default" @click="openTrackModal">
                    <template #icon>
                      <n-icon :component="Gps" :size="18" />
                    </template>
                    模拟轨迹
                  </n-button>
                  <n-button type="default" @click="openBin5Modal">
                    Bin5上报
                  </n-button>
                  <n-button type="default" @click="openBin82Modal">
                    Bin82上报
                  </n-button>
                  <n-button type="default" @click="openRawBinModal">
                    原始BIN上报
                  </n-button>
                </n-space>
              </template>
            </n-form-item>
          </n-form>
        </div>

        <div v-if="createError" class="error-block">
          <n-alert type="error" :title="createError" />
        </div>

        <!-- Cmd 数据 Tab 区域：仅在有 connect_id 且已拉取过 cmd 数据时展示 -->
        <div v-if="connectId" class="cmd-section">
          <div class="cmd-section-head">
            <span class="cmd-section-title">模拟透传命令cmd返回</span>
            <n-space>
              <n-button size="small" @click="fetchCmdAll">刷新</n-button>
              <n-button type="primary" size="small" @click="openAddCmd">新增</n-button>
            </n-space>
          </div>
          <n-tabs v-if="cmdEntries.length > 0" v-model:value="activeCmdTab" type="segment" addable @add="openAddCmd">
            <n-tab-pane v-for="entry in cmdEntries" :key="entry.key" :name="entry.key">
              <template #tab>
                <span class="cmd-tab-label">
                  <span>{{ entry.key }}</span>
                  <span class="cmd-tab-close-wrap">
                    <n-popconfirm positive-text="确认" negative-text="取消" @positive-click="handleCloseTab(entry.key)">
                      <template #trigger>
                        <n-button quaternary circle size="tiny" class="cmd-tab-close-btn" @click.stop>
                          <template #icon>
                            <n-icon :component="Trash" :size="12" />
                          </template>
                        </n-button>
                      </template>
                      是否确认删除该命令？
                    </n-popconfirm>
                  </span>
                </span>
              </template>
              <div class="cmd-pane-content">
                <div class="json-input-wrap">
                  <n-input v-model:value="entry.editValue" v-fit-textarea-height type="textarea" placeholder="JSON 字符串"
                    class="cmd-textarea cmd-json-display" :input-props="{ spellcheck: false, autocomplete: 'off' }" />
                  <n-space :size="8" class="json-input-actions">
                    <n-button type="default" size="small" @click="applyCmdEntryUnescape(entry)">去除转义</n-button>
                    <n-button type="default" size="small" @click="applyCmdEntryFormat(entry)">格式化</n-button>
                  </n-space>
                </div>
                <n-button type="primary" size="small" @click="saveCmd(entry)">
                  保存
                </n-button>
              </div>
            </n-tab-pane>
          </n-tabs>
          <div v-else-if="cmdLoadDone" class="cmd-empty">
            <n-empty description="暂无命令数据，可点击「新增」添加" />
          </div>
          <div v-else class="cmd-loading">
            <n-spin size="small" />
            <span>加载命令数据中...</span>
          </div>
        </div>
      </n-card>
    </div>

    <!-- 手动移动弹窗 -->
    <n-modal v-model:show="showMoveModal" preset="dialog" title="手动移动（通过GPS上报）" :mask-closable="false">
      <template #action>
        <n-button type="primary" :loading="moveLoading" @click="handleMoveSubmit">
          移动
        </n-button>
      </template>
      <n-form :model="moveForm" label-width="100px" label-placement="top">
        <n-form-item label="方位角">
          <div class="move-compass">
            <div class="compass-row compass-row-top">
              <span class="compass-cell" />
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 0 }" role="button"
                tabindex="0" @click="moveForm.bearing = 0" @keydown.enter.space.prevent="moveForm.bearing = 0">
                <span class="compass-option-dot" />
                <span>北 0°</span>
              </div>
              <span class="compass-cell" />
            </div>
            <div class="compass-row">
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 270 }" role="button"
                tabindex="0" @click="moveForm.bearing = 270" @keydown.enter.space.prevent="moveForm.bearing = 270">
                <span class="compass-option-dot" />
                <span>西 270°</span>
              </div>
              <div class="compass-cell compass-input-wrap">
                <n-input-number v-model:value="moveForm.bearing" :min="0" :max="360" :step="1" size="small"
                  :show-button="false" placeholder="°" class="compass-bearing-input" />
              </div>
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 90 }" role="button"
                tabindex="0" @click="moveForm.bearing = 90" @keydown.enter.space.prevent="moveForm.bearing = 90">
                <span class="compass-option-dot" />
                <span>东 90°</span>
              </div>
            </div>
            <div class="compass-row compass-row-bottom">
              <span class="compass-cell" />
              <div class="compass-option" :class="{ 'compass-option-selected': moveForm.bearing === 180 }" role="button"
                tabindex="0" @click="moveForm.bearing = 180" @keydown.enter.space.prevent="moveForm.bearing = 180">
                <span class="compass-option-dot" />
                <span>南 180°</span>
              </div>
              <span class="compass-cell" />
            </div>
          </div>
        </n-form-item>
        <n-form-item label="移动距离(米)">
          <n-input-number v-model:value="moveForm.distance" :min="0" :step="1" size="small" placeholder="米"
            :show-button="false" style="width: 100%" />
        </n-form-item>
      </n-form>
      <div class="move-record-section">
        <!-- <div class="move-record-title">移动记录</div> -->
        <ul v-if="moveRecordList.length > 0" class="move-record-list">
          <li v-for="(record, index) in moveRecordList" :key="index" class="move-record-item">
            <span class="move-record-arrow">{{ record.arrow }}</span>
            <span class="move-record-time">{{ record.dateTime }}</span>
            向 <span class="move-record-bearing"> {{ record.bearingLabel }} </span> 移动
            <span class="move-record-distance">{{ record.distance }} 米</span>
          </li>
        </ul>
        <div v-else class="move-record-empty">暂无移动记录</div>
      </div>
    </n-modal>

    <!-- 操作过快提示 -->
    <n-modal v-model:show="showTooFastModal" :mask-closable="true" style="width: 340px">
      <div class="gif-tip-modal">
        <img :src="haqiGif" alt="操作太快" class="gif-tip-img" />
        <div class="gif-tip-text">操作太快啦，不要点这么快～</div>
        <n-button type="primary" size="small" @click="showTooFastModal = false">知道了</n-button>
      </div>
    </n-modal>

    <!-- 上次模拟可能未停止提示 -->
    <n-modal v-model:show="showPrevMockModal" :mask-closable="true" style="width: 340px">
      <div class="gif-tip-modal">
        <img :src="baojiGif" alt="上次模拟可能未停止" class="gif-tip-img" />
        <div class="gif-tip-text">你的上一个模拟停止了吗？</div>
        <div class="gif-tip-sub">请及时关闭，避免占用连接资源</div>
        <n-button type="primary" size="small" @click="showPrevMockModal = false">知道了</n-button>
      </div>
    </n-modal>

    <!-- 未修改数据却更新提示 -->
    <n-modal v-model:show="showNoChangeModal" :mask-closable="true" style="width: 340px">
      <div class="gif-tip-modal">
        <img :src="qinghuapinAGif" alt="未修改数据" class="gif-tip-img" />
        <div class="gif-tip-text">你都没有更改任何数据，为什么要更新？</div>
        <n-button type="primary" size="small" @click="showNoChangeModal = false">知道了</n-button>
      </div>
    </n-modal>

    <!-- Bin5 告警上报弹窗 -->
    <n-modal v-model:show="showBin5Modal" preset="dialog" title="Bin5 告警上报" :mask-closable="false" style="width: 640px">
      <template #action>
        <n-button type="primary" :loading="bin5Loading" @click="handleBin5Submit">
          上报
        </n-button>
      </template>
      <n-form label-placement="top" label-width="auto">
        <n-form-item label="告警类型 (alarm_type)">
          <n-select
            v-model:value="bin5Form.alarm_type"
            :options="bin5AlarmTypeOptions"
            filterable
            tag
            clearable
            placeholder="选择或输入告警值"
            size="small"
            :consistent-menu-width="false"
            style="width: 100%"
          />
        </n-form-item>
        <n-button text type="primary" size="small" @click="openBin5ProtocolDoc">
          参考文档：CMD_5 上报通知
        </n-button>
      </n-form>
    </n-modal>

    <!-- Bin82 氢协议上报弹窗 -->
    <n-modal
      v-model:show="showBin82Modal"
      preset="card"
      title="CMD_BMS_INFO_V4 通用BMS信息上报{cmd:82}"
      :mask-closable="false"
      class="bin82-modal"
      :style="{ width: 'min(1880px, 98vw)' }"
    >
      <template #footer>
        <n-space justify="end">
          <n-button type="primary" :loading="bin82Loading" @click="handleBin82Submit">
            上报
          </n-button>
        </n-space>
      </template>
      <n-spin :show="false">
        <div class="bin82-toolbar">
          <span class="bin82-toolbar-label">协议版本</span>
          <n-select
            v-model:value="bin82Form.protocolVer"
            :options="bin82ProtocolOptions"
            size="small"
            :consistent-menu-width="false"
            class="bin82-protocol-select"
            @update:value="onBin82ProtocolChange"
          />
          <n-button text type="primary" size="small" @click="openBin82ProtocolDoc">
            参考文档
          </n-button>
        </div>
        <n-alert type="info" :show-icon="false" class="bin82-unit-tip" :bordered="false">
          {{ BIN82_FORM_UNIT_TIP }}
        </n-alert>
        <div v-if="bin82ActiveFields.length" class="bin82-fields">
          <div
            v-for="field in bin82ActiveFields"
            :key="field.key"
            class="bin82-field-cell"
            :class="{ 'bin82-field-cell--bits': isBin82BitField(field) }"
          >
            <div class="bin82-field-head" :title="field.description || field.label">
              <span class="bin82-field-name">{{ field.label }}</span>
              <span v-if="formatBin82FieldSummary(field)" class="bin82-field-summary">
                {{ formatBin82FieldSummary(field) }}
              </span>
            </div>
            <template v-if="isBin82BitField(field)">
              <div class="bin82-bit-toolbar">
                <n-input-number
                  v-model:value="bin82Form.data[field.key]"
                  size="small"
                  class="bin82-bit-num"
                  :show-button="false"
                  :min="0"
                  :max="getBin82BitMax(field)"
                />
                <span class="bin82-bit-meta">
                  {{ Number(bin82Form.data[field.key] ?? 0) }} · 0x{{
                    formatBin82BitHex(bin82Form.data[field.key], field)
                  }}
                </span>
              </div>
              <n-checkbox-group
                class="bin82-bit-group"
                :value="getBin82SelectedBits(field)"
                @update:value="(bits) => setBin82SelectedBits(field, bits as number[])"
              >
                <div class="bin82-bit-grid">
                  <n-checkbox
                    v-for="bit in getBin82BitDefs(field)"
                    :key="`${field.key}-${bit.bit}`"
                    :value="bit.bit"
                    :label="`BIT${bit.bit}: ${bit.label}`"
                  />
                </div>
              </n-checkbox-group>
            </template>
            <n-select
              v-else-if="isBin82EnumField(field)"
              v-model:value="bin82Form.data[field.key]"
              :options="getBin82EnumOptions(field)"
              size="small"
              clearable
              class="bin82-field-input"
            />
            <template v-else>
              <n-input
                v-if="isBin82StringField(field.type)"
                :value="String(bin82Form.data[field.key] ?? '')"
                size="small"
                :placeholder="field.key"
                @update:value="(v) => (bin82Form.data[field.key] = v)"
              />
              <n-input-number
                v-else
                v-model:value="bin82Form.data[field.key]"
                size="small"
                class="bin82-field-input"
                :show-button="false"
                :title="formatBin82UnitFillHint(field) || undefined"
              />
            </template>
          </div>
        </div>
      </n-spin>
    </n-modal>

    <!-- 原始 BIN 十六进制上报弹窗（任意 cmd） -->
    <n-modal
      v-model:show="showRawBinModal"
      preset="dialog"
      title="原始 BIN 十六进制上报"
      :mask-closable="false"
      style="width: 720px"
    >
      <template #action>
        <n-space :size="8">
          <n-button size="small" @click="triggerRawBinFile">上传文件</n-button>
          <n-button size="small" @click="rawBinHexInput = ''">清空</n-button>
          <n-button type="primary" :loading="rawBinLoading" @click="handleRawBinSubmit">
            上报
          </n-button>
        </n-space>
      </template>
      <p class="bin82-hex-hint">
        直接向中控链路发送原始报文，不限 cmd（如 bin5/bin66/bin68/bin82 等）。可粘贴或上传文件。
      </p>
      <input
        ref="rawBinFileInput"
        type="file"
        accept=".txt,.hex,.log,text/plain"
        class="bin82-hex-file-input"
        @change="onRawBinFileChange"
      />
      <n-input
        v-model:value="rawBinHexInput"
        type="textarea"
        :rows="12"
        size="small"
        placeholder="例如：AA55 44 … 完整 TCP 报文十六进制"
        class="bin82-hex-input"
      />
    </n-modal>

    <!-- 模拟轨迹弹窗 -->
    <n-modal v-model:show="showTrackModal" preset="dialog" title="模拟轨迹" :mask-closable="false" style="width: 600px">
      <template #action>
        <n-space :size="8">
          <n-button type="default" :disabled="trackLoading" @click="generateSampleTrack">添加示例</n-button>
          <n-button type="primary" :loading="trackLoading" @click="handleTrackStart">
            提交轨迹
          </n-button>
        </n-space>
      </template>
      <n-form label-width="80px">
        <n-form-item label="轨迹点，将按照下面经纬度列表依次上报数据">
          <div class="track-input-wrap">
            <n-input v-model:value="trackText" type="textarea" :rows="12" size="small"
              placeholder="每行一个坐标，格式：经度,纬度&#10;为空时提交将清除已提交" :disabled="trackLoading" style="width: 100%" />
            <n-button v-if="trackText.trim()" text size="small" class="track-clear-btn" @click="trackText = ''">
              清除
            </n-button>
          </div>
        </n-form-item>
      </n-form>
    </n-modal>

    <!-- 新增 Cmd 弹窗 -->
    <n-modal v-model:show="showAddModal" preset="dialog" title="新增命令" positive-text="确定"
      @positive-click="confirmAddCmd">
      <n-form :model="addForm" label-width="80px">
        <n-form-item label="cmd" path="cmd" required>
          <n-input v-model:value="addForm.cmd" placeholder="如 31、34" size="small" />
        </n-form-item>
        <n-form-item label="value" path="value">
          <div class="json-input-wrap">
            <n-input v-model:value="addForm.value" v-fit-textarea-height type="textarea" :rows="6" size="small"
              placeholder="JSON 字符串" class="cmd-textarea cmd-json-display"
              :input-props="{ spellcheck: false, autocomplete: 'off' }" style="width: 100%" />
            <n-space :size="8" class="json-input-actions">
              <n-button type="default" size="small" @click="applyAddFormUnescape">去除转义</n-button>
              <n-button type="default" size="small" @click="applyAddFormFormat">格式化</n-button>
            </n-space>
          </div>
        </n-form-item>
      </n-form>
    </n-modal>

    <amap-coord-picker
      v-model:show="showCoordPicker"
      :lng="formData.lng"
      :lat="formData.lat"
      @confirm="handleCoordPickerConfirm"
    />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "XiaoanEcuMock" });

import { ref, reactive, nextTick, computed } from "vue";
import { createDiscreteApi } from "naive-ui";
import { Help, Gps, Trash, Dice } from "@vicons/tabler";
import {
  rentalEcuMockAddAPI,
  xiaoanEcuMockCmdAllAPI,
  xiaoanEcuMockListAPI,
  xiaoanEcuMockCmdSetAPI,
  xiaoanEcuMockDeleteAPI,
  xiaoanEcuMockUpdateAPI,
  xiaoanEcuMockMoveAPI,
  xiaoanEcuMockTrajectoryAPI,
  xiaoanEcuMockBin5API,
  xiaoanEcuMockBinAPI,
  xiaoanEcuMockBin82API,
} from "@/api/device";
import {
  bin5AlarmTypeOptions,
  BIN5_PROTOCOL_DOC_URL,
  parseBin5AlarmType,
} from "@/tools/ecu-mock/bin5-alarm-types";
import {
  BIN82_PROTOCOL_DOC_URL,
  BIN82_FORM_UNIT_TIP,
  buildBin82FormData,
  formatBin82FieldSummary,
  formatBin82UnitFillHint,
  getBin82BitDefs,
  getBin82BitWidth,
  getBin82EnumOptions,
  isBin82BitField,
  isBin82EnumField,
  isBin82StringField,
  packBin82Bits,
  packBin82SubmitData,
  unpackBin82Bits,
  type Bin82FieldSchema,
  type Bin82FormContext,
  type Bin82ProtocolSchema,
} from "@/tools/ecu-mock/bin82-protocol";
import { BIN82_PROTOCOL_SCHEMAS } from "@/tools/ecu-mock/bin82-schemas";
import haqiGif from "@/assets/image/haqi.gif";
import baojiGif from "@/assets/image/baoji.gif";
import qinghuapinAGif from "@/assets/image/qinghuapinA.gif";

const { message, dialog } = createDiscreteApi(["message", "dialog"]);

/** 5 秒内「立即更新 / 手动移动」点击次数达到阈值时弹提示（不拦截操作） */
const TOO_FAST_WINDOW_MS = 5000;
const TOO_FAST_THRESHOLD = 2;
const showTooFastModal = ref(false);
const tooFastClickTimes: number[] = [];

function checkTooFastClick() {
  const now = Date.now();
  while (
    tooFastClickTimes.length > 0 &&
    now - tooFastClickTimes[0]! > TOO_FAST_WINDOW_MS
  ) {
    tooFastClickTimes.shift();
  }
  tooFastClickTimes.push(now);
  if (tooFastClickTimes.length >= TOO_FAST_THRESHOLD) {
    showTooFastModal.value = true;
  }
}

/** 模拟成功后写入；停止模拟后清除。下次创建时若仍存在则提示（不拦截） */
const ACTIVE_MOCK_FLAG_KEY = "XATTP_ECU_MOCK_ACTIVE";
const showPrevMockModal = ref(false);

function hasActiveMockFlag(): boolean {
  try {
    return localStorage.getItem(ACTIVE_MOCK_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function setActiveMockFlag() {
  try {
    localStorage.setItem(ACTIVE_MOCK_FLAG_KEY, "1");
  } catch {
    // ignore
  }
}

function clearActiveMockFlag() {
  try {
    localStorage.removeItem(ACTIVE_MOCK_FLAG_KEY);
  } catch {
    // ignore
  }
}

function warnIfPrevMockPossiblyActive() {
  if (hasActiveMockFlag()) {
    showPrevMockModal.value = true;
  }
}
const BASE_PATH = "/xattp-server";
const DEFAULT_COORD_LNG = 114.434888;
const DEFAULT_COORD_LAT = 30.500136;

/** 校验接口返回 code，不为 0 时 toast 返回的 msg 并返回 false */
function checkResCode(res: any): boolean {
  if (res != null && Number(res.code) !== 0) {
    message.error(res.msg || "请求失败");
    return false;
  }
  return true;
}

/** 获取有滚动条的第一个祖先 */
function getScrollParent(node: Element | null): Element | null {
  let p = node?.parentElement ?? null;
  while (p) {
    const { overflowY } = getComputedStyle(p);
    if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return p;
    p = p.parentElement;
  }
  return null;
}

/** 使 n-input textarea 随内容增高，减少滚动；调整时保持滚动位置，避免点击编辑时窗口跳动 */
function fitTextareaHeight(el: HTMLElement) {
  const textarea = el.tagName === "TEXTAREA" ? (el as HTMLTextAreaElement) : el.querySelector("textarea");
  if (!textarea) return;
  const winScrollY = window.scrollY ?? document.documentElement.scrollTop;
  const textareaScrollTop = textarea.scrollTop;
  const scrollParent = getScrollParent(textarea);
  const parentScrollTop = scrollParent ? scrollParent.scrollTop : 0;
  nextTick(() => {
    const ta = el.tagName === "TEXTAREA" ? (el as HTMLTextAreaElement) : el.querySelector("textarea");
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 200)}px`;
    ta.scrollTop = textareaScrollTop;
    if (scrollParent) scrollParent.scrollTop = parentScrollTop;
    window.scrollTo({ top: winScrollY, behavior: "auto" });
  });
}

const vFitTextareaHeight = {
  mounted(el: HTMLElement) {
    fitTextareaHeight(el);
    const textarea = el.querySelector("textarea");
    if (textarea) {
      textarea.addEventListener("input", () => fitTextareaHeight(el));
    }
  },
  updated(el: HTMLElement) {
    fitTextareaHeight(el);
  },
};

const STORAGE_KEY = "XATTP_ECU_MOCK_FORM";

/** 服务区输入模式：名称 或 ID */
type ServiceAreaInputMode = "name" | "id";

/** 表单持久化结构（与 formData 字段一致，用于 localStorage） */
interface StoredForm {
  env?: string;
  tenant_id?: string;
  imei?: string;
  ref_imei?: string;
  lng?: number | null;
  lat?: number | null;
  voltage?: number | null;
  battery_sn?: string;
  battery_soc?: number | null;
  version?: string;
  service_area_id?: string;
  service_area_name?: string;
  serviceAreaInputMode?: ServiceAreaInputMode;
  seat_locked?: boolean;
  power_exists?: boolean;
  has_helmet?: boolean;
  helmet_react?: boolean;
  helmet_lock?: boolean;
  tlv?: string;
}

/** 默认表单值 */
const defaultFormData = {
  env: "test2",
  tenant_id: "1",
  imei: "",
  ref_imei: "",
  lng: 114.434888,
  lat: 30.500136,
  voltage: 55,
  battery_sn: "",
  battery_soc: 100,
  version: "1.2.3",
  service_area_id: "",
  service_area_name: "",
  serviceAreaInputMode: "name" as ServiceAreaInputMode,
  seat_locked: true,
  power_exists: true,
  has_helmet: false,
  helmet_react: false,
  helmet_lock: false,
  tlv: "",
};

/** 从 localStorage 读取并合并为初始表单（用于首屏回显，刷新/进入页面时执行一次） */
function getInitialFormData(): typeof defaultFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultFormData };
    const data = JSON.parse(raw) as StoredForm;
    return {
      env:
        typeof data.env === "string" && data.env.trim()
          ? data.env.trim()
          : defaultFormData.env,
      tenant_id:
        typeof data.tenant_id === "string"
          ? data.tenant_id.replace(/\D/g, "")
          : defaultFormData.tenant_id,
      imei:
        typeof data.imei === "string" ? data.imei : defaultFormData.imei,
      ref_imei:
        typeof data.ref_imei === "string" ? data.ref_imei : defaultFormData.ref_imei,
      lng:
        typeof data.lng === "number" && !Number.isNaN(data.lng)
          ? data.lng
          : defaultFormData.lng,
      lat:
        typeof data.lat === "number" && !Number.isNaN(data.lat)
          ? data.lat
          : defaultFormData.lat,
      voltage:
        typeof data.voltage === "number" && !Number.isNaN(data.voltage)
          ? data.voltage
          : defaultFormData.voltage,
      battery_sn:
        typeof data.battery_sn === "string" ? data.battery_sn : defaultFormData.battery_sn,
      battery_soc:
        typeof data.battery_soc === "number" &&
        !Number.isNaN(data.battery_soc) &&
        data.battery_soc >= 0 &&
        data.battery_soc <= 100
          ? data.battery_soc
          : defaultFormData.battery_soc,
      version:
        typeof data.version === "string"
          ? data.version
          : defaultFormData.version,
      service_area_id:
        typeof data.service_area_id === "string"
          ? data.service_area_id
          : defaultFormData.service_area_id,
      service_area_name:
        typeof data.service_area_name === "string"
          ? data.service_area_name
          : defaultFormData.service_area_name,
      serviceAreaInputMode:
        data.serviceAreaInputMode === "name" || data.serviceAreaInputMode === "id"
          ? data.serviceAreaInputMode
          : defaultFormData.serviceAreaInputMode,
      seat_locked:
        typeof data.seat_locked === "boolean" ? data.seat_locked : defaultFormData.seat_locked,
      power_exists:
        typeof data.power_exists === "boolean" ? data.power_exists : defaultFormData.power_exists,
      has_helmet:
        typeof data.has_helmet === "boolean" ? data.has_helmet : defaultFormData.has_helmet,
      helmet_react:
        typeof data.helmet_react === "boolean" ? data.helmet_react : defaultFormData.helmet_react,
      helmet_lock:
        typeof data.helmet_lock === "boolean" ? data.helmet_lock : defaultFormData.helmet_lock,
      tlv: typeof data.tlv === "string" ? data.tlv : defaultFormData.tlv,
    };
  } catch (_e) {
    return { ...defaultFormData };
  }
}

/** 服务区输入类型下拉选项 */
const serviceAreaInputModeOptions = [
  { label: "名称", value: "name" },
  { label: "ID", value: "id" },
];

/** env 下拉选项，可按需从接口或配置加载 */
const envOptions = [
  { label: "test2", value: "test2" },
  { label: "dev", value: "dev" },
  { label: "uat", value: "uat" },

  {
    label: 'prod',
    value: 'prod',
  },
  {
    label: 'prod2',
    value: 'prod2',
  },

  {
    label: "独立部署-云江出行",
    value: "yunjiang",
    tenantID: 1955,
  },
  // {
  //   label: "独立部署-银川微公交",
  //   value: "yinchuan",
  //   tenantID: 1752,
  // },
  // {
  //   label: "独立部署-城发悠出行",
  //   value: "chengfayou",
  //   tenantID: 2233,
  // },
  {
    label: "独立部署-圣庄出行",
    value: "shengzhuang",
    tenantID: 2654,
  },
  {
    label: "独立部署-北斗千行",
    value: "bdqx",
    tenantID: 2719,
  },
  {
    label: "独立部署-骑宜骑",
    value: "qiyiqi",
    tenantID: 250,
  },
  {
    label: "独立部署-飞凡",
    value: "feifan",
    tenantID: 2001,
  },
];

const formData = reactive(getInitialFormData());

/** 可更新字段快照：用于判断「立即更新」时表单是否有改动 */
const lastUpdateableSnapshot = ref<string | null>(null);
const showNoChangeModal = ref(false);

function getUpdateableFormSnapshot(): string {
  return JSON.stringify({
    lng: formData.lng ?? null,
    lat: formData.lat ?? null,
    voltage: formData.voltage ?? null,
    battery_sn: (formData.battery_sn ?? "").trim(),
    battery_soc: formData.battery_soc ?? null,
    version: formData.version ?? "",
    seat_locked: !!formData.seat_locked,
    power_exists: !!formData.power_exists,
    has_helmet: !!formData.has_helmet,
    helmet_react: !!formData.helmet_react,
    helmet_lock: !!formData.helmet_lock,
    tlv: formData.tlv ?? "",
  });
}

function rememberUpdateableFormSnapshot() {
  lastUpdateableSnapshot.value = getUpdateableFormSnapshot();
}

function clearUpdateableFormSnapshot() {
  lastUpdateableSnapshot.value = null;
}

function isUpdateableFormUnchanged(): boolean {
  if (lastUpdateableSnapshot.value == null) return false;
  return lastUpdateableSnapshot.value === getUpdateableFormSnapshot();
}

interface ExistingMockItem {
  imei: string;
  raw: Record<string, unknown>;
}
const existingMockList = ref<ExistingMockItem[]>([]);
const activeExistingMockImei = ref("");

/**
 * 从对象中按候选 key 取字符串值
 * @param source 原对象
 * @param keys 候选 key 列表
 * @returns 命中的字符串；未命中返回 undefined
 */
function pickString(source: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      return value;
    }
  }
  return undefined;
}

/**
 * 从对象中按候选 key 取数字值
 * @param source 原对象
 * @param keys 候选 key 列表
 * @returns 命中的数字；未命中返回 undefined
 */
function pickNumber(source: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * 从对象中按候选 key 取布尔值
 * @param source 原对象
 * @param keys 候选 key 列表
 * @returns 命中的布尔值；未命中返回 undefined
 */
function pickBoolean(source: Record<string, unknown>, keys: string[]): boolean | undefined {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return undefined;
}

/**
 * 将 list 返回对象回显到表单
 * @param item list 中单条对象
 */
function applyExistingMockToForm(item: Record<string, unknown>) {
  const env = pickString(item, ["env"]);
  const tenantId = pickString(item, ["tenant_id", "tenantId"]);
  const imei = pickString(item, ["imei"]);
  const refImei = pickString(item, ["ref_imei", "refImei"]);
  const lng = pickNumber(item, ["lng", "longitude"]);
  const lat = pickNumber(item, ["lat", "latitude"]);
  const voltage = pickNumber(item, ["voltage"]);
  const batterySn = pickString(item, ["battery_sn", "batterySn"]);
  const batterySoc = pickNumber(item, ["battery_soc", "batterySoc"]);
  const version = pickString(item, ["version"]);
  const serviceAreaId = pickString(item, ["service_area_id", "serviceAreaId"]);
  const serviceAreaName = pickString(item, ["service_area_name", "serviceAreaName"]);
  const seatLocked = pickBoolean(item, ["seat_locked", "seatLocked"]);
  const powerExists = pickBoolean(item, ["power_exists", "powerExists"]);
  const hasHelmet = pickBoolean(item, ["has_helmet", "hasHelmet"]);
  const helmetReact = pickBoolean(item, ["helmet_react", "helmetReact"]);
  const helmetLock = pickBoolean(item, ["helmet_lock", "helmetLock"]);
  const tlv = item.tlv;

  if (typeof env === "string" && env.trim()) formData.env = env.trim();
  if (typeof tenantId === "string") formData.tenant_id = tenantId.replace(/\D/g, "");
  if (typeof imei === "string") formData.imei = imei;
  if (typeof refImei === "string") formData.ref_imei = refImei;
  if (typeof lng === "number") formData.lng = lng;
  if (typeof lat === "number") formData.lat = lat;
  if (typeof voltage === "number") formData.voltage = voltage;
  if (typeof batterySn === "string") formData.battery_sn = batterySn;
  if (typeof batterySoc === "number") formData.battery_soc = batterySoc;
  if (typeof version === "string") formData.version = version;
  formData.service_area_id = typeof serviceAreaId === "string" ? serviceAreaId : "";
  formData.service_area_name = typeof serviceAreaName === "string" ? serviceAreaName : "";
  formData.serviceAreaInputMode = formData.service_area_name?.trim() ? "name" : "id";
  if (typeof seatLocked === "boolean") formData.seat_locked = seatLocked;
  if (typeof powerExists === "boolean") formData.power_exists = powerExists;
  if (typeof hasHelmet === "boolean") formData.has_helmet = hasHelmet;
  if (typeof helmetReact === "boolean") formData.helmet_react = helmetReact;
  if (typeof helmetLock === "boolean") formData.helmet_lock = helmetLock;
  if (Array.isArray(tlv)) {
    formData.tlv = JSON.stringify(tlv, null, 2);
  } else if (typeof tlv === "string") {
    formData.tlv = tlv;
  } else {
    formData.tlv = "";
  }
  carId.value = pickCarId(item);
}

/**
 * 拉取当前用户已有 mock 连接，按 imei 作为 tab
 */
async function fetchExistingMockList() {
  try {
    const res: any = await xiaoanEcuMockListAPI();
    if (!checkResCode(res)) return;
    const data = Array.isArray(res?.data) ? res.data : [];
    const list: ExistingMockItem[] = data
      .map((raw: unknown) => {
        const record = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
        if (!record) return null;
        const imei = pickString(record, ["imei"]);
        if (!imei) return null;
        return { imei, raw: record };
      })
      .filter((item: ExistingMockItem | null): item is ExistingMockItem => item != null);
    existingMockList.value = list;
  } catch (_e) {
    // 列表加载失败不阻塞页面使用
  }
}

/**
 * 切换已存在连接 tab：回显对象到表单并自动开始模拟
 * @param imei tab 名称（即 imei）
 */
async function handleExistingMockTabChange(imei: string) {
  if (!imei || createLoading.value) return;
  const selected = existingMockList.value.find((item) => item.imei === imei);
  if (!selected) return;
  if (connectId.value) {
    await handleDisconnect();
  }
  applyExistingMockToForm(selected.raw);
  await doCreate();
}

/**
 * 切换服务区输入模式时，清除原输入框内容，避免把旧值带到新模式
 * @param _nextMode 目标模式（name / id），由 v-model 自动更新
 */
function onServiceAreaInputModeChange(_nextMode: ServiceAreaInputMode) {
  formData.service_area_id = "";
  formData.service_area_name = "";
  saveFormToStorage();
}

/** 将当前表单保存到 localStorage */
function saveFormToStorage() {
  try {
    const payload: StoredForm = {
      env: formData.env,
      tenant_id: formData.tenant_id,
      imei: formData.imei,
      ref_imei: formData.ref_imei,
      lng: formData.lng,
      lat: formData.lat,
      voltage: formData.voltage,
      battery_sn: formData.battery_sn,
      battery_soc: formData.battery_soc,
      version: formData.version,
      service_area_id: formData.service_area_id,
      service_area_name: formData.service_area_name,
      serviceAreaInputMode: formData.serviceAreaInputMode,
      seat_locked: formData.seat_locked,
      power_exists: formData.power_exists,
      has_helmet: formData.has_helmet,
      helmet_react: formData.helmet_react,
      helmet_lock: formData.helmet_lock,
      tlv: formData.tlv,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (_e) {
    // 忽略存储失败（如隐私模式）
  }
}

const createLoading = ref(false);
const updateLoading = ref(false);
const deleteLoading = ref(false);
const createError = ref("");
const connectId = ref("");
/** 模拟成功后后端返回的车辆号（无则不展示） */
const carId = ref<string | null>(null);
const cmdMap = ref<Record<string, string>>({});
const cmdLoadDone = ref(false);

/** 从接口对象中解析 car_id，无有效值时返回 null */
function pickCarId(source: Record<string, unknown> | null | undefined): string | null {
  if (!source || typeof source !== "object") return null;
  const raw = source.car_id ?? source.carId;
  if (raw == null || raw === "") return null;
  return String(raw);
}

/** 用于 Tab 展示与编辑的条目：key + 原始 value + 当前编辑 value */
interface CmdEntry {
  key: string;
  value: string;
  editValue: string;
}
const cmdEntries = ref<CmdEntry[]>([]);
/** 当前选中的 cmd tab name，关闭 tab 时切换到下一个 */
const activeCmdTab = ref("");

/** 若为合法 JSON 则格式化为缩进字符串，否则返回原串 */
function formatJsonIfPossible(str: string): string {
  if (!str || typeof str !== "string") return str;
  const trimmed = str.trim();
  if (!trimmed) return str;
  try {
    const parsed = JSON.parse(trimmed);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return str;
  }
}

/**
 * 去除 JSON 字符串中的反斜杠转义（如 \" -> "，\\ -> \，\n -> 换行等）
 * @param str - 可能包含转义字符的字符串
 * @returns 去除转义后的字符串，若处理异常则返回原串
 */
function unescapeJsonString(str: string): string {
  if (!str || typeof str !== "string") return str;
  try {
    return str.replace(/\\(.)/g, (_, c: string) => {
      const map: Record<string, string> = {
        '"': '"',
        "\\": "\\",
        n: "\n",
        r: "\r",
        t: "\t",
      };
      return map[c] ?? c;
    });
  } catch {
    return str;
  }
}

/** Cmd Tab 当前条目的 editValue：去除转义后写回 */
function applyCmdEntryUnescape(entry: CmdEntry) {
  entry.editValue = unescapeJsonString(entry.editValue ?? "");
}

/** Cmd Tab 当前条目的 editValue：格式化后写回 */
function applyCmdEntryFormat(entry: CmdEntry) {
  entry.editValue = formatJsonIfPossible(entry.editValue ?? "");
}

/** 新增命令弹窗 value：去除转义后写回 */
function applyAddFormUnescape() {
  const raw = addForm.value ?? "";
  addForm.value = unescapeJsonString(raw);
}

/** 新增命令弹窗 value：格式化后写回 */
function applyAddFormFormat() {
  const raw = addForm.value ?? "";
  addForm.value = formatJsonIfPossible(raw);
}

/** 从 cmdMap 同步到 cmdEntries，便于 tab 展示与编辑；值为 JSON 时格式化显示 */
function syncCmdEntries() {
  const map = cmdMap.value;
  const entries: CmdEntry[] = Object.keys(map).map((key) => {
    const raw = map[key];
    const formatted = formatJsonIfPossible(raw);
    return {
      key,
      value: raw,
      editValue: formatted,
    };
  });
  cmdEntries.value = entries;
  if (entries.length && !entries.some((e) => e.key === activeCmdTab.value)) {
    activeCmdTab.value = entries[0].key;
  }
}

/** TLV 协议文档 URL（小安 CMD_GPS_V6 状态上报） */
const TLV_PROTOCOL_DOC_URL =
  "https://xc-res.oss-cn-shenzhen.aliyuncs.com/protocol/sharing_bak%40%23%40%24/%E5%B0%8F%E5%AE%89%E7%A7%91%E6%8A%80%E5%85%B1%E4%BA%AB%E8%BD%A6%E6%9C%BA%E9%80%9A%E4%BF%A1%E5%8D%8F%E8%AE%AE(BIN_ALL).html#_cmd_gps_v6%E7%8A%B6%E6%80%81%E4%B8%8A%E6%8A%A5_cmd_68";

/** TLV 示例数据（插入到输入框） */
const TLV_EXAMPLE_JSON = [
  { type_hex: "0x0B", value_bin: "00001111" },
  { type: 15, value: "03" },
];

/**
 * 在新标签页打开 TLV 协议参考文档
 */
function openTlvProtocolDoc() {
  window.open(TLV_PROTOCOL_DOC_URL, "_blank", "noopener,noreferrer");
}

/**
 * 将 TLV 示例插入到表单输入框（格式化后的 JSON 字符串）
 */
function insertTlvExample() {
  formData.tlv = JSON.stringify(TLV_EXAMPLE_JSON, null, 4);
}

/**
 * 校验 TLV 表单字符串：非空时必须是合法的 JSON 数组。
 * @param raw - 用户输入的 JSON 字符串
 * @returns 校验通过返回 null，否则返回错误提示文案
 */
function validateTlvFormValue(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed);
    if (!Array.isArray(parsed)) {
      return "TLV数据必须为 JSON 数组格式";
    }
    return null;
  } catch {
    return "TLV数据 JSON 格式错误，请检查括号、逗号与引号";
  }
}

/**
 * 解析 TLV 表单字符串为数组，供接口使用。非法或空则返回 []。
 * @param raw - 用户输入的 JSON 字符串
 * @returns TLV 项数组
 */
function parseTlvFormValue(raw: string): unknown[] {
  if (!raw || typeof raw !== "string") return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 租户ID 仅允许数字，内部存为字符串 */
function onTenantIdInput(v: string | null) {
  const next = String(v ?? "").replace(/\D/g, "");
  formData.tenant_id = next;
}

/** 生成 15 位数字、以 868686 开头的随机 IMEI */
function randomImei() {
  let tail = "";
  for (let i = 0; i < 7; i++) {
    tail += Math.floor(Math.random() * 10);
  }
  formData.imei = `86868686${tail}`;
}

function resetDefaultCoords() {
  formData.lng = DEFAULT_COORD_LNG;
  formData.lat = DEFAULT_COORD_LAT;
  saveFormToStorage();
}

function handleCoordPickerConfirm(payload: { lng: number; lat: number }) {
  formData.lng = payload.lng;
  formData.lat = payload.lat;
  saveFormToStorage();
  message.success("坐标已设置");
}

/** 「模拟头盔」开关变化时：打开则下面两项默认打开，关闭则下面两项也关闭 */
function onHasHelmetChange(val: boolean) {
  if (val) {
    formData.helmet_react = true;
    formData.helmet_lock = true;
  } else {
    formData.helmet_react = false;
    formData.helmet_lock = false;
  }
}

function validateBeforeCreate(): boolean {
  if (!formData.env || !formData.tenant_id?.trim() || !formData.imei?.trim()) {
    message.error("请填写 环境、租户ID、IMEI");
    return false;
  }
  const imei = formData.imei.trim();
  const refImei = formData.ref_imei?.trim();
  if (refImei && refImei === imei) {
    message.error("参考IMEI不能和 IMEI 填一样");
    return false;
  }
  const tlvError = validateTlvFormValue(formData.tlv);
  if (tlvError) {
    message.error(tlvError);
    return false;
  }
  return true;
}

/** 创建 mock 连接：点击按钮时二次确认 */
function handleCreate() {
  if (!validateBeforeCreate()) return;
  dialog.warning({
    title: "确认开始模拟",
    content: "请确认未使用真实存在的 IMEI。使用真实 IMEI 可能影响线上/真实设备，是否继续？",
    positiveText: "确认开始",
    negativeText: "取消",
    onPositiveClick: () => {
      void doCreate();
    },
  });
}

async function doCreate() {
  if (!validateBeforeCreate()) return;
  const imei = formData.imei.trim();
  const refImei = formData.ref_imei?.trim();
  warnIfPrevMockPossiblyActive();
  createLoading.value = true;
  createError.value = "";
  try {
    const payload: Record<string, unknown> = {
      env: formData.env,
      business_type: 1,
      tenant_id: formData.tenant_id.trim(),
      imei,
      voltage: formData.voltage ?? 55,
      version: formData.version || "1.2.3",
    };
    if (refImei) {
      payload.ref_imei = refImei;
    }
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.battery_sn != null && formData.battery_sn !== "") {
      payload.battery_sn = formData.battery_sn.trim();
    }
    if (formData.battery_soc != null) payload.battery_soc = formData.battery_soc;
    if (formData.serviceAreaInputMode === "name" && formData.service_area_name?.trim()) {
      payload.service_area_name = formData.service_area_name.trim();
    } else if (formData.service_area_id?.trim()) {
      payload.service_area_id = formData.service_area_id.trim();
    }
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;
    payload.tlv = parseTlvFormValue(formData.tlv);

    const res: any = await rentalEcuMockAddAPI(payload);
    if (!checkResCode(res)) return;
    const data = res?.data;
    let id = "";
    if (typeof data === "string") {
      id = data;
    } else if (data && typeof data.connect_id === "string") {
      id = data.connect_id;
    } else if (data && typeof data === "object") {
      id = data.connect_id ?? "";
    }
    if (!id) {
      message.error("返回中未包含 connect_id");
      return;
    }
    connectId.value = id;
    carId.value = data && typeof data === "object" ? pickCarId(data as Record<string, unknown>) : null;
    setActiveMockFlag();
    rememberUpdateableFormSnapshot();
    await fetchCmdAll();
    saveFormToStorage();
    message.success(`模拟中控成功`);
  } catch (e: any) {
    createError.value = e?.message || String(e) || "创建失败";
    message.error(createError.value);
  } finally {
    createLoading.value = false;
  }
}

/** 更新 mock 数据（经度、纬度、电压、版本、座舱锁、电源在位） */
async function handleUpdate() {
  if (!connectId.value) return;
  if (isUpdateableFormUnchanged()) {
    showNoChangeModal.value = true;
  }
  checkTooFastClick();
  const tlvError = validateTlvFormValue(formData.tlv);
  if (tlvError) {
    message.error(tlvError);
    return;
  }
  updateLoading.value = true;
  try {
    const payload: Record<string, unknown> = {
      connect_id: connectId.value,
      bin68_immediately: true,
    };
    if (formData.lng != null) payload.lng = formData.lng;
    if (formData.lat != null) payload.lat = formData.lat;
    if (formData.voltage != null) payload.voltage = formData.voltage;
    if (formData.battery_sn != null && formData.battery_sn !== "") {
      payload.battery_sn = formData.battery_sn.trim();
    }
    if (formData.battery_soc != null) payload.battery_soc = formData.battery_soc;
    if (formData.version != null && formData.version !== "")
      payload.version = formData.version;
    payload.seat_locked = formData.seat_locked;
    payload.power_exists = formData.power_exists;
    payload.has_helmet = formData.has_helmet;
    payload.helmet_react = formData.helmet_react;
    payload.helmet_lock = formData.helmet_lock;
    payload.tlv = parseTlvFormValue(formData.tlv);
    const res: any = await xiaoanEcuMockUpdateAPI(payload);
    if (!checkResCode(res)) return;
    rememberUpdateableFormSnapshot();
    saveFormToStorage();
    message.success("更新模拟数据成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "更新失败");
  } finally {
    updateLoading.value = false;
  }
}

/** 断开 mock 连接：无论接口成功或失败都重置连接与 cmd 状态 */
async function handleDisconnect() {
  if (!connectId.value) return;
  deleteLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockDeleteAPI({ connect_id: connectId.value });
    if (checkResCode(res)) {
      message.success(`已断开连接`);
    } else {
      message.error("断开请求失败");
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "断开失败");
  } finally {
    connectId.value = "";
    carId.value = null;
    clearActiveMockFlag();
    clearUpdateableFormSnapshot();
    cmdMap.value = {};
    cmdEntries.value = [];
    cmdLoadDone.value = false;
    moveRecordList.value = [];
    deleteLoading.value = false;
  }
}

/** 拉取所有 mock 命令数据 */
async function fetchCmdAll() {
  if (!connectId.value) return;
  cmdLoadDone.value = false;
  try {
    const res: any = await xiaoanEcuMockCmdAllAPI({
      connect_id: connectId.value,
    });
    if (!checkResCode(res)) {
      cmdMap.value = {};
      syncCmdEntries();
      return;
    }
    const data = res?.data;
    cmdMap.value =
      data && typeof data === "object" && !Array.isArray(data) ? { ...data } : {};
    syncCmdEntries();
  } catch (e: any) {
    message.error(e?.message || String(e) || "获取命令数据失败");
    cmdMap.value = {};
    syncCmdEntries();
  } finally {
    cmdLoadDone.value = true;
  }
}

/** 保存单条命令（修改） */
async function saveCmd(entry: CmdEntry) {
  if (!connectId.value) return;
  try {
    const res: any = await xiaoanEcuMockCmdSetAPI({
      connect_id: connectId.value,
      cmd: entry.key,
      value: entry.editValue,
    });
    if (!checkResCode(res)) return;
    entry.value = entry.editValue;
    cmdMap.value = { ...cmdMap.value, [entry.key]: entry.editValue };
    message.success("保存成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "保存失败");
  }
}

const showAddModal = ref(false);
const addForm = reactive({ cmd: "", value: "" });

const showMoveModal = ref(false);
const showCoordPicker = ref(false);
const moveForm = reactive({ bearing: 0, distance: 100 });
const moveLoading = ref(false);
/** 连续向北移动次数，用于彩蛋 */
const consecutiveNorthCount = ref(0);

/** 移动记录项：日期时间、方向文案、距离(米)、方向箭头 */
interface MoveRecord {
  dateTime: string;
  bearingLabel: string;
  distance: number;
  arrow: string;
}
const moveRecordList = ref<MoveRecord[]>([]);

/** 格式化为 2025.10.1 12:23:59 */
function formatMoveRecordDateTime(d: Date): string {
  const y = d.getFullYear();
  const M = d.getMonth() + 1;
  const D = d.getDate();
  const h = d.getHours();
  const m = d.getMinutes();
  const s = d.getSeconds();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}.${M}.${D} ${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** 方位角转展示文案：0 北 90 东 180 南 270 西，其余为 45° */
function getBearingLabel(bearing: number): string {
  const map: Record<number, string> = {
    0: "北",
    90: "东",
    180: "南",
    270: "西",
  };
  return map[bearing] ?? `${bearing}°`;
}

/** 方位角转方向箭头：北↑ 东→ 南↓ 西←，其余用 ↗ */
function getBearingArrow(bearing: number): string {
  const map: Record<number, string> = {
    0: "↑",
    90: "→",
    180: "↓",
    270: "←",
  };
  return map[bearing] ?? "↗";
}

/** 打开手动移动弹窗，默认选中北(0°) */
function openMoveModal() {
  moveForm.bearing = 0;
  showMoveModal.value = true;
}

/** 手动移动：调用接口后 toast 提示，不关闭弹窗 */
async function handleMoveSubmit(): Promise<boolean> {
  if (!connectId.value) return false;
  checkTooFastClick();
  moveLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockMoveAPI({
      connect_id: connectId.value,
      bearing: Number(moveForm.bearing) || 0,
      distance: Number(moveForm.distance) || 0,
      bin68_immediately: true,
    });
    if (!checkResCode(res)) return false;
    const data = res?.data;
    if (data?.new) {
      const parts = String(data.new).split(",");
      if (parts.length >= 2) {
        const nLng = Number.parseFloat(parts[0].trim());
        const nLat = Number.parseFloat(parts[1].trim());
        if (!Number.isNaN(nLng)) formData.lng = nLng;
        if (!Number.isNaN(nLat)) formData.lat = nLat;
      }
    }
    rememberUpdateableFormSnapshot();
    const bearing = Number(moveForm.bearing) || 0;
    const distance = Number(moveForm.distance) || 0;
    moveRecordList.value.unshift({
      dateTime: formatMoveRecordDateTime(new Date()),
      bearingLabel: getBearingLabel(bearing),
      distance,
      arrow: getBearingArrow(bearing),
    });
    if (bearing === 0) {
      consecutiveNorthCount.value += 1;
      if (consecutiveNorthCount.value >= 3) {
        message.success("触发彩蛋：我一路向北~ 离开有你的季节~");
        consecutiveNorthCount.value = 0;
      } else {
        if (data?.old != null && data?.new != null) {
          message.success(`已移动`);
        } else {
          message.success("移动成功");
        }
      }
    } else {
      consecutiveNorthCount.value = 0;
      if (data?.old != null && data?.new != null) {
        message.success(`已移动：${data.old} → ${data.new}`);
      } else {
        message.success("移动成功");
      }
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "移动失败");
  } finally {
    moveLoading.value = false;
  }
  return false;
}

/* ========== Bin5 告警上报 ========== */
const showBin5Modal = ref(false);
const bin5Form = reactive<{ alarm_type: number | string | null }>({ alarm_type: null });
const bin5Loading = ref(false);

function openBin5ProtocolDoc() {
  window.open(BIN5_PROTOCOL_DOC_URL, "_blank", "noopener,noreferrer");
}

function openBin5Modal() {
  showBin5Modal.value = true;
}

/** Bin5 上报：调用接口后 toast，不关闭弹窗 */
async function handleBin5Submit() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const alarmType = parseBin5AlarmType(bin5Form.alarm_type);
  if (alarmType == null) {
    message.error("请选择或输入有效的告警类型数字");
    return;
  }
  bin5Loading.value = true;
  try {
    const res: any = await xiaoanEcuMockBin5API({
      connect_id: connectId.value,
      alarm_type: alarmType,
    });
    if (!checkResCode(res)) return;
    message.success(res?.data || "上报 bin5 alarm 成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "Bin5 上报失败");
  } finally {
    bin5Loading.value = false;
  }
}

/* ========== Bin82 氢协议上报 ========== */
const showBin82Modal = ref(false);
const showRawBinModal = ref(false);
const bin82Loading = ref(false);
const rawBinLoading = ref(false);
const rawBinHexInput = ref("");
const rawBinFileInput = ref<HTMLInputElement | null>(null);
/** 协议字段定义（注释、单位、BIT）前端写死，见 bin82-schemas.ts */
const bin82Schemas: Bin82ProtocolSchema[] = BIN82_PROTOCOL_SCHEMAS;
const bin82Form = reactive<{
  protocolVer: number;
  data: Record<string, string | number | null>;
}>({
  protocolVer: 2,
  data: {},
});

const bin82ProtocolOptions = computed(() =>
  bin82Schemas.map((s) => ({ label: s.title, value: s.protocolVer })),
);

const bin82ActiveFields = computed(() => {
  const schema = bin82Schemas.find((s) => s.protocolVer === bin82Form.protocolVer);
  return schema?.fields ?? [];
});

function getBin82FormContext(): Bin82FormContext {
  return {
    imei: formData.imei,
    battery_sn: formData.battery_sn,
    battery_soc: formData.battery_soc,
    voltage: formData.voltage,
  };
}

function resetBin82FieldValues() {
  bin82Form.data = buildBin82FormData(bin82ActiveFields.value, getBin82FormContext());
}

function openBin82Modal() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  if (
    bin82Schemas.length &&
    !bin82Schemas.some((s) => s.protocolVer === bin82Form.protocolVer)
  ) {
    bin82Form.protocolVer = bin82Schemas[0].protocolVer;
  }
  // 仅首次打开时初始化默认值；再次打开保留上次填写
  if (Object.keys(bin82Form.data).length === 0) {
    resetBin82FieldValues();
  } else if (
    bin82Form.data.timestamp == null ||
    bin82Form.data.timestamp === "" ||
    Number(bin82Form.data.timestamp) <= 0
  ) {
    // 再次打开时若 timestamp 未填，刷新为当前时间
    bin82Form.data.timestamp = Math.floor(Date.now() / 1000);
  }
  showBin82Modal.value = true;
}

function onBin82ProtocolChange() {
  resetBin82FieldValues();
}

function openBin82ProtocolDoc() {
  window.open(BIN82_PROTOCOL_DOC_URL, "_blank", "noopener,noreferrer");
}

/* ========== 原始 BIN 十六进制上报（任意 cmd） ========== */
function openRawBinModal() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  showRawBinModal.value = true;
}

function triggerRawBinFile() {
  rawBinFileInput.value?.click();
}

/**
 * 规范化十六进制文本：去掉 0x/空格/逗号等，仅保留 0-9A-F
 * @param hexText 用户输入或文件内容
 */
function normalizeHexText(hexText: string): string {
  return String(hexText || "")
    .replace(/0x/gi, "")
    .replace(/[^0-9a-fA-F]/g, "")
    .toUpperCase();
}

/**
 * 读取上传的十六进制文件内容到输入框
 * @param e 文件选择事件
 */
function onRawBinFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    rawBinHexInput.value = String(reader.result ?? "").trim();
    message.success(`已载入文件：${file.name}`);
  };
  reader.onerror = () => {
    message.error("读取文件失败");
  };
  reader.readAsText(file);
  input.value = "";
}

/** 直接上报任意原始 BIN 十六进制报文 */
async function handleRawBinSubmit() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const hex = normalizeHexText(rawBinHexInput.value);
  if (!hex) {
    message.error("请输入或上传十六进制数据");
    return;
  }
  if (hex.length % 2) {
    message.error("十六进制长度必须为偶数");
    return;
  }
  rawBinLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockBinAPI({
      connect_id: connectId.value,
      hex,
    });
    if (!checkResCode(res)) return;
    message.success(res?.data || "上报原始 BIN 成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "原始 BIN 上报失败");
  } finally {
    rawBinLoading.value = false;
  }
}

function getBin82BitMax(field: Bin82FieldSchema): number {
  return getBin82BitWidth(field) === 32 ? 0xffffffff : 0xffff;
}

function formatBin82BitHex(value: string | number | null | undefined, field: Bin82FieldSchema): string {
  const width = getBin82BitWidth(field) / 4;
  const num = Number(value) || 0;
  return num.toString(16).toUpperCase().padStart(width, "0");
}

function getBin82SelectedBits(field: Bin82FieldSchema): number[] {
  return unpackBin82Bits(bin82Form.data[field.key], getBin82BitWidth(field));
}

function setBin82SelectedBits(field: Bin82FieldSchema, bits: number[]) {
  bin82Form.data[field.key] = packBin82Bits(bits);
}

async function handleBin82Submit() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const fields = bin82ActiveFields.value;
  if (!fields.length) {
    message.error("请选择有效的协议版本");
    return;
  }
  bin82Loading.value = true;
  try {
    const payload = packBin82SubmitData(bin82Form.protocolVer, fields, bin82Form.data);
    const res: any = await xiaoanEcuMockBin82API({
      connect_id: connectId.value,
      data: payload,
    });
    if (!checkResCode(res)) return;
    message.success(res?.data || "上报 bin82 成功");
  } catch (e: any) {
    message.error(e?.message || String(e) || "Bin82 上报失败");
  } finally {
    bin82Loading.value = false;
  }
}

/* ========== 模拟轨迹 ========== */
const showTrackModal = ref(false);
const trackText = ref("");
const trackLoading = ref(false);

/** 打开模拟轨迹弹窗 */
function openTrackModal() {
  showTrackModal.value = true;
}

/**
 * 根据起点坐标、方位角、距离计算新坐标（GCJ02 近似）
 * @param lng 起点经度
 * @param lat 起点纬度
 * @param bearing 方位角（度，0=北 90=东 180=南 270=西）
 * @param distance 距离（米）
 * @returns [新经度, 新纬度]
 */
function offsetCoord(lng: number, lat: number, bearing: number, distance: number): [number, number] {
  const R = 6371000;
  const rad = Math.PI / 180;
  const bearingRad = bearing * rad;
  const latRad = lat * rad;
  const dLat = (distance * Math.cos(bearingRad)) / R;
  const dLng = (distance * Math.sin(bearingRad)) / (R * Math.cos(latRad));
  return [
    Math.round((lng + dLng / rad) * 1000000) / 1000000,
    Math.round((lat + dLat / rad) * 1000000) / 1000000,
  ];
}

/** 添加示例：模拟电动车骑行轨迹，大体沿一个方向前进，小幅度转弯 */
function generateSampleTrack() {
  let lng = formData.lng ?? 114.397428;
  let lat = formData.lat ?? 39.90923;
  const lines: string[] = [`${lng},${lat}`];
  let bearing = Math.random() * 360;
  for (let i = 1; i < 12; i++) {
    const delta = (Math.random() - 0.5) * 30;
    bearing = (bearing + delta + 360) % 360;
    const dist = 30 + Math.random() * 20;
    [lng, lat] = offsetCoord(lng, lat, bearing, dist);
    lines.push(`${lng},${lat}`);
  }
  trackText.value = lines.join("\n");
}

/**
 * 解析轨迹文本为坐标数组
 * @returns 坐标数组 { lng, lat }[]
 */
function parseTrackPoints(): Array<{ lng: number; lat: number }> {
  return trackText.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      return { lng: Number.parseFloat(parts[0]), lat: Number.parseFloat(parts[1]) };
    })
    .filter((p) => !Number.isNaN(p.lng) && !Number.isNaN(p.lat));
}

/** 提交模拟轨迹：内容为空时清除轨迹，否则设置轨迹坐标列表 */
async function handleTrackStart() {
  if (!connectId.value) {
    message.error("请先开始模拟");
    return;
  }
  const points = parseTrackPoints();
  trackLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockTrajectoryAPI({
      connect_id: connectId.value,
      points,
    });
    if (!checkResCode(res)) return;
    if (points.length === 0) {
      message.success("轨迹已清除");
    } else {
      message.success(res?.data || `轨迹已设置，共 ${points.length} 个坐标点`);
    }
  } catch (e: any) {
    message.error(e?.message || String(e) || "轨迹设置失败");
  } finally {
    trackLoading.value = false;
  }
}

function openAddCmd() {
  addForm.cmd = "";
  addForm.value = '{"code":0}';
  showAddModal.value = true;
}

function confirmAddCmd() {
  const key = addForm.cmd?.trim();
  if (!key) {
    message.error("请输入 cmd");
    return false;
  }
  if (cmdMap.value[key] !== undefined) {
    message.error("该 cmd 已存在，请直接在修改");
    return false;
  }
  cmdEntries.value.push({
    key,
    value: addForm.value,
    editValue: addForm.value,
  });
  cmdMap.value = { ...cmdMap.value, [key]: addForm.value };
  saveCmd(cmdEntries.value[cmdEntries.value.length - 1]);
  showAddModal.value = false;
  return true;
}

/** 关闭 Tab：从当前列表中移除，并调用 set 置空以在服务端删除；若关闭的是当前 tab 则切换到下一个 */
async function handleCloseTab(name: string) {
  const idx = cmdEntries.value.findIndex((e) => e.key === name);
  if (idx === -1) return;
  const entry = cmdEntries.value[idx];
  const wasActive = name === activeCmdTab.value;
  cmdEntries.value.splice(idx, 1);
  const nextKey =
    cmdEntries.value[idx]?.key ?? cmdEntries.value[idx - 1]?.key ?? "";
  if (wasActive) activeCmdTab.value = nextKey;
  const next: Record<string, string> = { ...cmdMap.value };
  delete next[name];
  cmdMap.value = next;
  if (connectId.value) {
    try {
      const res: any = await xiaoanEcuMockCmdSetAPI({
        connect_id: connectId.value,
        cmd: name,
        value: "",
      });
      if (!checkResCode(res)) {
        cmdEntries.value.splice(idx, 0, entry);
        cmdMap.value = { ...cmdMap.value, [name]: entry.value };
        if (wasActive) activeCmdTab.value = name;
      }
    } catch {
      cmdEntries.value.splice(idx, 0, entry);
      cmdMap.value = { ...cmdMap.value, [name]: entry.value };
      if (wasActive) activeCmdTab.value = name;
    }
  }
}

</script>

<style lang="less" scoped>
.xiaoan-ecu-mock {
  width: 100%;
  margin: 0;

  :deep(.n-card) {
    padding: 10px;
  }
}

/* 连接成功时：整卡绿色边框（无动画） */
.card-wrap {
  border-radius: 8px;
}

.card-wrap-reporting {
  border-radius: 10px;
  border: 2px solid #22c55e;
}

.card-wrap-reporting :deep(.n-card) {
  border-radius: 6px;
}

.form-section {
  max-width: 960px;
}

/* Bin82 弹窗：宽屏紧凑网格，页脚固定可见上报按钮 */
:deep(.bin82-modal) {
  .n-card {
    max-height: 92vh;
    display: flex;
    flex-direction: column;
  }

  .n-card-header {
    flex-shrink: 0;
    padding: 10px 16px 8px;
    font-size: 14px;
    font-weight: 600;
  }

  .n-card__content {
    flex: 1;
    min-height: 0;
    padding: 0 16px 8px;
    overflow: auto;
  }

  .n-card__footer {
    flex-shrink: 0;
    padding: 8px 16px 10px;
    border-top: 1px solid var(--n-divider-color);
  }
}

.bin82-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--n-divider-color);
}

.bin82-toolbar-label {
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color);
}

.bin82-protocol-select {
  width: min(420px, 100%);
}

.bin82-unit-tip {
  margin-bottom: 8px;
  font-size: 11px;
  line-height: 1.35;

  :deep(.n-alert-body) {
    padding: 4px 8px;
  }
}

.bin82-hex-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--n-text-color-3);
}

.bin82-hex-file-input {
  display: none;
}

.bin82-hex-input {
  width: 100%;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 11px;
}

.bin82-fields {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 6px 8px;
  align-content: start;
  padding-bottom: 4px;
}

.bin82-field-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bin82-field-head {
  display: flex;
  align-items: baseline;
  flex-wrap: nowrap;
  gap: 4px;
  min-width: 0;
  line-height: 1.2;
  overflow: hidden;
}

.bin82-field-name {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--n-text-color);
}

.bin82-field-summary {
  flex: 1;
  min-width: 0;
  font-size: 10px;
  color: var(--n-text-color-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bin82-field-input {
  width: 100%;
}

.bin82-field-cell--bits {
  grid-column: 1 / -1;
  padding: 6px 8px;
  border: 1px dashed var(--n-border-color);
  border-radius: 4px;
  background: var(--n-color-modal);
  gap: 4px;
}

.bin82-bit-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-bottom: 2px;
}

.bin82-bit-num {
  width: 100px;
}

.bin82-bit-meta {
  font-size: 10px;
  color: var(--n-text-color-3);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.bin82-bit-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 2px 8px;

  :deep(.n-checkbox) {
    font-size: 11px;
  }

  :deep(.n-checkbox__label) {
    padding-left: 6px;
  }
}

.existing-tabs-wrap {
  margin-bottom: 10px;
}

.existing-tabs-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.form-section :deep(.n-form-item) {
  margin-bottom: 2px;
}

.form-section .form-item-buttons {
  margin-top: 6px;
  margin-bottom: 0;
}

.car-id-hint {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: #15803d;
  word-break: break-all;
  user-select: text;
  cursor: text;
}

/* 模拟成功后的只读输入框：灰底只读样式，可选中、可复制 */
.form-section .input-readonly-gray :deep(.n-input__input-el) {
  cursor: text;
  user-select: text;
  min-width: 0;
  background-color: #f3f4f6 !important;
  color: #6b7280;
}

.form-section .input-readonly-gray :deep(.n-input-wrapper) {
  background-color: #f3f4f6 !important;
}

.imei-field {
  width: 100%;
}

.imei-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.imei-warn-tip {
  margin-top: 6px;
  font-size: 12px;
  line-height: 1.45;
  color: #d03050;
}

.imei-row .n-input {
  flex: 1;
  min-width: 0;
}

.service-area-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  min-width: 0;
}

.service-area-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.service-area-row .service-area-type-select {
  width: 80px;
  flex-shrink: 0;
}

.service-area-row .service-area-input {
  flex: 1;
  min-width: 0;
}

.tip-icon {
  vertical-align: middle;
  cursor: help;
  color: #999;
}

.coord-actions-row {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
  width: 100%;
  min-height: 28px;
}

.coord-actions-row :deep(.n-button) {
  flex-shrink: 0;
  white-space: nowrap;
}

.battery-soc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.soc-unit {
  color: #6b7280;
  font-size: 12px;
  flex-shrink: 0;
}

.tlv-input-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.tlv-input-row .tlv-textarea {
  flex: 1;
  min-width: 0;
  font-size: 11px;
}

.tlv-input-row .tlv-textarea :deep(.n-input__input-el),
.tlv-input-row .tlv-textarea :deep(textarea) {
  font-size: 11px;
}

.tlv-input-row .tlv-btns {
  flex-shrink: 0;
}

.move-compass {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

.move-compass .compass-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
}

.move-compass .compass-cell {
  width: 72px;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.move-compass .compass-input-wrap {
  width: 72px;
  min-width: 72px;
  display: flex;
  justify-content: center;
}

.move-compass .compass-bearing-input {
  width: 100%;
}

.move-compass .compass-bearing-input :deep(.n-input__input-el) {
  text-align: center;
}

/* 方位选项：卡片式，非按钮，选中态为绿色 */
.move-compass .compass-option {
  min-width: 72px;
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: border-color 0.2s, background-color 0.2s, color 0.2s;
}

.move-compass .compass-option:hover {
  border-color: #9ca3af;
  background: #f3f4f6;
}

.move-compass .compass-option-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 1.5px solid #d1d5db;
  flex-shrink: 0;
  transition: border-color 0.2s, background-color 0.2s;
}

/* 选中后显示绿色 */
.move-compass .compass-option-selected {
  border-color: #22c55e;
  background: #dcfce7;
  color: #15803d;
}

.move-compass .compass-option-selected .compass-option-dot {
  border-color: #22c55e;
  background: #22c55e;
}

.move-compass .compass-option-selected:hover {
  border-color: #16a34a;
  background: #bbf7d0;
}

/* 模拟移动弹窗 - 移动记录列表 */
.move-record-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  max-height: 200px;
  overflow-y: auto;
}

.move-record-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.move-record-list {
  margin: 0;
  padding-left: 0;
  list-style: none;
  max-height: 200px;
  overflow-y: auto;
  font-size: 13px;
}

.move-record-item {
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.move-record-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  font-size: 14px;
  color: #15803d;
  flex-shrink: 0;
}

.move-record-time {
  color: #6b7280;
}

.move-record-bearing {
  color: #15803d;
}

.move-record-distance {
  color: #1d4ed8;
}

.move-record-empty {
  font-size: 13px;
  color: #9ca3af;
}

.error-block {
  margin-top: 12px;
  max-width: 960px;
}

.cmd-section {
  margin-top: 20px;
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.cmd-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.cmd-section-title {
  font-weight: 600;
  font-size: 14px;
}

/* tab 标签：名称在左，删除图标绝对定位到最右侧，减少误触 */
.cmd-tab-label {
  display: inline-flex;
  align-items: center;
  position: relative;
  padding-right: 26px;
  min-width: 100%;
  box-sizing: border-box;
}

.cmd-tab-label .cmd-tab-close-wrap {
  position: absolute;
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.cmd-tab-label .cmd-tab-close-btn {
  color: #9ca3af;
  width: 22px;
  height: 22px;
  min-width: 22px;
  padding: 0;
}

.cmd-tab-label .cmd-tab-close-btn:hover {
  color: #6b7280;
}

.cmd-pane-content {
  padding: 12px 0;
}

/* JSON 输入框右上角操作按钮容器 */
.json-input-wrap {
  position: relative;
  margin-bottom: 8px;
  width: 100%;
}

.json-input-wrap .json-input-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.json-input-wrap .cmd-textarea {
  margin-bottom: 0;
}

.cmd-textarea {
  margin-bottom: 8px;
  font-family: "Consolas", "Monaco", "Menlo", "Ubuntu Mono", monospace;
  line-height: 0.9;
}

.cmd-json-display {
  font-size: 12px;
  line-height: 0.9;
}

.cmd-json-display :deep(textarea) {
  font-family: "Consolas", "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 12px;
  line-height: 0.9;
  min-height: 60vh;
  resize: vertical;
}

.cmd-empty,
.cmd-loading {
  padding: 24px;
  text-align: center;
  color: #999;
}

.cmd-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 轨迹输入框容器，右上角放清除按钮 */
.track-input-wrap {
  position: relative;
  width: 100%;
}

.track-clear-btn {
  position: absolute;
  top: 4px;
  right: 8px;
  z-index: 1;
  color: #9ca3af;
}

.track-clear-btn:hover {
  color: #f56c6c;
}

.gif-tip-modal {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 16px 16px;
  background: #fff;
  border-radius: 8px;
}

.gif-tip-img {
  width: 220px;
  max-width: 100%;
  border-radius: 6px;
  display: block;
}

.gif-tip-text {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  text-align: center;
}

.gif-tip-sub {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
  margin-top: -4px;
}
</style>
