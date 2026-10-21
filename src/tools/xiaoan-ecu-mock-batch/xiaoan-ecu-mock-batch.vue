<template>
  <div class="xiaoan-ecu-mock-batch">
    <div v-if="batchSessions.length > 0 || batchGroupsLoading" class="existing-tabs-wrap">
      <div class="existing-tabs-row">
        <button
          v-for="session in batchSessions"
          :key="session.id"
          type="button"
          class="mock-tab"
          :class="{
            'mock-tab-active': session.id === activeSessionId,
            'mock-tab-removing': removingSessionId === session.id,
          }"
          :disabled="removingSessionId === session.id"
          @click="handleSessionTabChange(session.id)"
        >
          <span class="mock-tab-text">
            <span class="mock-tab-top">
              <span class="mock-status-tag mock-status-tenant">{{ formatBusinessType(session.business_type) }}</span>
              <span class="mock-status-tag mock-status-env">{{ session.env || "-" }}</span>
              <span class="mock-status-tag mock-status-tenant">{{ formatBatchMode(session.formDataSnapshot.mode) }}</span>
              <span class="mock-tab-imei">{{ session.batchCount ?? session.rows.length }}台</span>
              <span class="mock-tab-time" :title="session.createDatetime">{{ formatRelativeCreateAt(session.createDatetime) }}</span>
            </span>
            <span v-if="session.formDataSnapshot.mode === 2" class="mock-tab-imei-row">
              <span v-if="session.formDataSnapshot.start_imei" class="mock-tab-imei-range" title="点击复制IMEI范围" @click.stop="copyImeiRange(session)">
                {{ session.formDataSnapshot.start_imei }}-{{ getEndImei(session) }}
              </span>
            </span>
            <span v-if="session.formDataSnapshot.mode === 3" class="mock-tab-imei-row">
              <span class="mock-tab-imei-range">
                {{ getFirstSpecifiedImei(session) }}等
              </span>
            </span>
          </span>
          <n-button
            quaternary
            circle
            size="tiny"
            class="mock-tab-close-btn"
            title="删除批次"
            :loading="removingSessionId === session.id"
            :disabled="removingSessionId === session.id"
            @click.stop="handleRemoveSession(session.id)"
          >
            <template #icon>
              <n-icon :component="Trash" :size="12" />
            </template>
          </n-button>
        </button>
        <n-button
          type="primary"
          size="small"
          secondary
          class="add-mock-button"
          @click="handleAddBatchTab"
        >
          <template #icon>
            <n-icon :component="Plus" :size="16" />
          </template>
          新增批次
        </n-button>
        <div class="tabs-summary">
          <span class="tabs-summary-text">
            共 {{ batchSessions.length }} 批，{{ totalDeviceCount }} 台
          </span>
        </div>
      </div>
      <div v-if="batchGroupsLoading" class="tabs-loading-bar">
        <n-spin size="small" />
      </div>
    </div>
    <n-card>
      <n-spin :show="batchRecordLoading">
        <div class="form-section">
          <n-form :model="formData" :disabled="batchMockSessionActive || batchRecordLoading" label-placement="left"
            label-width="110px">
            <n-grid :cols="12" :x-gap="12" :y-gap="4">
              <n-gi :span="12">
                <n-form-item label="设备网关" required>
                  <div class="gateway-row">
                    <div class="gateway-main-row">
                      <n-input v-model:value="formData.server" placeholder="请输入设备网关，或点击下方「共享 / 短租 / 海外」在弹窗中选择环境并自动填充"
                        clearable size="small" class="gateway-input" />
                      <div class="tenant-inline">
                        <div class="tenant-label-row">
                          <span>租户ID</span>
                          <n-tooltip trigger="hover" style="margin-left: 8px;">
                            <template #trigger>
                              <span class="tip-text">?</span>
                            </template>
                            共享环境需要填入租户ID入住，否则后续无法绑定。
                          </n-tooltip>
                        </div>
                        <n-input v-model:value="formData.tenant_id" placeholder="当共享时请输入，设备入驻需要" clearable size="small"
                          class="tenant-input" />
                      </div>
                    </div>
                    <n-space :size="8" class="gateway-buttons">
                      <n-button size="small" :disabled="batchMockSessionActive || batchRecordLoading"
                        :loading="envPickerLoading && envPickerSource === 'ebike'" @click="openEnvPickerModal('ebike')">
                        共享
                      </n-button>
                      <n-button size="small" :disabled="batchMockSessionActive || batchRecordLoading"
                        :loading="envPickerLoading && envPickerSource === 'rental'"
                        @click="openEnvPickerModal('rental')">
                        短租
                      </n-button>
                      <n-button size="small" :disabled="batchMockSessionActive || batchRecordLoading"
                        :loading="envPickerLoading && envPickerSource === 'oversea'"
                        @click="openEnvPickerModal('oversea')">
                        海外
                      </n-button>
                    </n-space>
                  </div>
                </n-form-item>
              </n-gi>

              <n-gi :span="12">
                <n-form-item label="IMEI规则" required>
                  <div class="mode-section">
                    <n-radio-group v-model:value="formData.mode" name="batch-mode">
                      <n-space>
                        <!-- <n-radio :value="1">随机模式</n-radio> -->
                        <n-radio :value="2">顺序模式</n-radio>
                        <n-radio :value="3">指定模式</n-radio>
                      </n-space>
                    </n-radio-group>
                    <div class="mode-tip">
                      {{ modeTipText }}
                    </div>
                  </div>
                </n-form-item>
              </n-gi>

              <!-- <n-gi :span="12" v-if="formData.mode === 1">
                <n-form-item label="创建数量" required>
                  <div class="num-field">
                    <n-input :value="numInputStr" type="number" inputmode="numeric" min="1" placeholder="请输入随机创建数量"
                      clearable size="small" class="num-input" @update:value="onNumInputStrUpdate"
                      @wheel.prevent="onNumInputWheel" />
                  </div>
                </n-form-item>
              </n-gi> -->

              <template v-if="formData.mode === 2">
                <n-gi :span="6">
                  <n-form-item label="起始IMEI" required>
                    <div class="start-imei-row">
                      <n-input v-model:value="formData.start_imei" class="start-imei-input" placeholder="15 位数字"
                        clearable size="small" maxlength="15" />
                      <n-button size="small" class="start-imei-random-btn" @click="fillRandomStartImei">
                        随机
                      </n-button>
                    </div>
                  </n-form-item>
                </n-gi>
                <n-gi :span="6">
                  <n-form-item label="创建数量" required>
                    <div class="num-field">
                      <n-input :value="numInputStr" type="number" inputmode="numeric" min="1" placeholder="请输入顺序创建数量"
                        clearable size="small" class="num-input" @update:value="onNumInputStrUpdate"
                        @wheel.prevent="onNumInputWheel" />
                    </div>
                  </n-form-item>
                </n-gi>
              </template>

              <n-gi :span="12" v-if="formData.mode === 3">
                <n-form-item label="IMEI 列表" required>
                  <div class="imeis-textarea-wrap">
                    <n-input v-model:value="formData.imeis_text" type="textarea" :autosize="{ minRows: 6, maxRows: 12 }"
                      placeholder="请输入 IMEI 列表，支持按换行、空格、逗号分隔" clearable size="small" />
                    <div class="imeis-preview">
                      已识别 {{ validImeis.length }} 个有效 IMEI（15 位数字）
                    </div>
                    <div class="imeis-preview csv-actions-row">
                      <n-upload class="csv-upload-inline" :default-upload="false" :show-file-list="false"
                        accept=".csv,text/csv" @before-upload="handleImeiLngLatCsvBeforeUpload">
                        <n-button size="small">上传CSV</n-button>
                      </n-upload>
                      <n-button tag="a" size="small"
                        href="https://ebike-dianlv-test2.xiaoantech.com/xattp/template/imei_lng_lat.csv"
                        target="_blank">
                        下载模板
                      </n-button>
                    </div>
                  </div>
                </n-form-item>
              </n-gi>

              <n-gi :span="12">
                <n-form-item label="经纬度模式" required>
                  <n-radio-group v-model:value="formData.coord_mode" name="coord-mode">
                    <n-space :size="8">
                      <n-radio value="scatter">中心点分散</n-radio>
                      <n-radio value="fixed">指定经纬度</n-radio>
                    </n-space>
                  </n-radio-group>
                </n-form-item>
              </n-gi>
              <n-gi :span="6" v-if="formData.coord_mode === 'scatter'">
                <n-form-item required>
                  <template #label>
                    <div class="coord-label-wrap">
                      <span>经纬度(GCJ02)</span>
                      <c-link href="https://lbs.amap.com/tools/picker" target="_blank" rel="noopener"
                        class="coord-picker-link">
                        高德坐标拾取器
                      </c-link>
                    </div>
                  </template>
                  <n-input v-model:value="formData.coord_combined_text"
                    placeholder="114.399113,30.506147（经度,纬度）" clearable size="small"
                    @update:value="onCoordCombinedTextUpdate" />
                </n-form-item>
              </n-gi>
              <n-gi :span="4" v-if="formData.coord_mode === 'scatter'">
                <n-form-item label="随机半径(m)">
                  <template #label>
                    <span>随机半径(m)</span>
                    <n-tooltip trigger="hover" style="margin-left: 8px;">
                      <template #trigger>
                        <span class="tip-text">?</span>
                      </template>
                      会以当前经纬度为中心，在该半径范围内随机生成坐标
                    </n-tooltip>
                  </template>
                  <n-input-number placeholder="请输入,为0时表示不随机" v-model:value="formData.radius_m" :min="0"
                    :show-button="false" size="small" style="width: 100%" />
                </n-form-item>
              </n-gi>
              <n-gi :span="10" v-if="formData.coord_mode === 'fixed'">
                <n-form-item required>
                  <template #label>
                    <div class="coord-label-wrap">
                      <span>经纬度列表</span>
                      <c-link href="https://lbs.amap.com/tools/picker" target="_blank" rel="noopener"
                        class="coord-picker-link">
                        高德坐标拾取器
                      </c-link>
                    </div>
                  </template>
                  <div class="imeis-textarea-wrap">
                    <n-input v-model:value="formData.coordinates_text" type="textarea"
                      :autosize="{ minRows: 5, maxRows: 10 }" placeholder="请输入一行一个经纬度，格式：lng,lat（经度在前、纬度在后）" clearable
                      size="small" @update:value="saveFormToStorage" />
                    <div class="imeis-preview">
                      已识别 {{ parsedCoordinates.count }} 个经纬度，本次创建中控模拟数量 {{ expectedCoordinateCount }}
                      <template v-if="
                        expectedCoordinateCount > 0 &&
                        parsedCoordinates.count > 0 &&
                        parsedCoordinates.count === expectedCoordinateCount
                      ">
                        （与创建数量一致，按顺序指定经纬度）
                      </template>
                      <template v-else-if="
                        expectedCoordinateCount > 0 &&
                        parsedCoordinates.count > 0 &&
                        parsedCoordinates.count !== expectedCoordinateCount
                      ">
                        （与创建数量不一致，将从上述经纬度随机分散）
                      </template>
                    </div>
                    <div class="imeis-preview" v-if="parsedCoordinates.error">
                      {{ parsedCoordinates.error }}
                    </div>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="2">
                <n-form-item :label-width="0">
                  <n-button type="default" size="small" :disabled="batchMockSessionActive || batchRecordLoading"
                    @click="resetDefaultCoords">
                    重置经纬度
                  </n-button>
                </n-form-item>
              </n-gi>

              <n-gi :span="3">
                <n-form-item label="立即开始骑行">
                  <template #label>
                    <span>立即开始骑行</span>
                    <n-tooltip trigger="hover" style="margin-left: 8px;">
                      <template #trigger>
                        <span class="tip-text">?</span>
                      </template>
                      开启后电门开启（acc=1），设防关闭（defend=0），GPS 每 5 秒快速上报
                    </n-tooltip>
                  </template>
                  <n-switch :value="formData.immediate_start_riding"
                    @update:value="onImmediateStartRidingUpdate" />
                </n-form-item>
              </n-gi>

              <n-gi :span="4">
                <n-form-item label="随机移动(m)">
                  <template #label>
                    <span>随机移动(m)</span>
                    <n-tooltip trigger="hover" style="margin-left: 8px;">
                      <template #trigger>
                        <span class="tip-text">?</span>
                      </template>
                      每次 bin68 定时上报时，相对上一次坐标在 0～该距离（米）内随机移动一步；首包不移动，0 表示始终固定
                    </n-tooltip>
                  </template>
                  <n-input-number v-model:value="formData.random_move_m" :min="0" placeholder="0"
                    :show-button="false" size="small" style="width: 100%" @update:value="saveFormToStorage" />
                </n-form-item>
              </n-gi>

              <n-gi :span="12">
                <n-form-item label="电压范围（V）">
                  <div class="voltage-range">
                    <n-slider v-model:value="voltageSlider" range :min="VOLTAGE_MIN" :max="VOLTAGE_MAX" :step="1"
                      @update:value="onVoltageSliderUpdate" />
                    <div class="voltage-inputs">
                      <n-input-number v-model:value="formData.voltage_min" :min="VOLTAGE_MIN" :max="VOLTAGE_MAX"
                        :show-button="false" size="small" placeholder="最小" @update:value="onVoltageNumberUpdate" />
                      <span class="voltage-sep">~</span>
                      <n-input-number v-model:value="formData.voltage_max" :min="VOLTAGE_MIN" :max="VOLTAGE_MAX"
                        :show-button="false" size="small" placeholder="最大" @update:value="onVoltageNumberUpdate" />
                    </div>
                  </div>
                </n-form-item>
              </n-gi>

              <n-gi :span="7">
                <n-form-item label="创建模式" required>
                  <div class="mode-section">
                    <n-space :size="12" align="center" wrap>
                      <n-radio-group v-model:value="formData.create_mode" name="create-mode">
                        <n-space :size="8">
                          <n-radio :value="1">并行创建</n-radio>
                          <n-radio :value="2">串行创建</n-radio>
                        </n-space>
                      </n-radio-group>
                      <template v-if="formData.create_mode === 2">
                        <span class="mode-tip">间隔(ms)</span>
                        <n-input-number v-model:value="formData.serial_interval_ms" :min="0" :show-button="false"
                          size="small" style="width: 140px" @update:value="saveFormToStorage" />
                      </template>
                    </n-space>
                    <div class="mode-tip">
                      {{ createModeTipText }}
                    </div>
                  </div>
                </n-form-item>
              </n-gi>
              <n-gi :span="5">
                <n-form-item label="响应延迟(秒)">
                  <div class="reply-delay-row">
                    <n-input-number v-model:value="formData.reply_delay_sec" :min="0" :max="REPLY_DELAY_MAX_SEC"
                      :precision="0" :show-button="false" size="small" class="reply-delay-input" placeholder="0"
                      @update:value="onReplyDelaySecUpdate" />
                    <div class="scheduled-report-inline">
                      <span class="scheduled-report-label">周期上报</span>
                      <n-tooltip trigger="hover" style="margin-left: 2px;">
                        <template #trigger>
                          <span class="tip-text">?</span>
                        </template>
                        关闭：只上报一次数据；开启：周期上报数据
                      </n-tooltip>
                      <n-switch :value="formData.enable_scheduled_report"
                        :disabled="formData.immediate_start_riding"
                        @update:value="onEnableScheduledReportUpdate" />
                    </div>
                  </div>
                </n-form-item>
              </n-gi>

              <n-gi :span="12">
                <n-form-item class="form-actions">
                  <div class="form-actions-row">
                    <n-space>
                      <n-button v-if="!batchMockSessionActive" type="primary" :loading="createLoading"
                        :disabled="batchRecordLoading" @click="handleCreate">
                        批量创建
                      </n-button>
                      <n-button v-else type="warning" :loading="stopMockLoading"
  :disabled="batchRecordLoading || (checkedRowKeys.length === 0 && !hasBatchGroup)" @click="handleStopMock">
  停止模拟（{{ stopCount }}）
</n-button>
                      <!-- <n-button v-if="batchMockSessionActive" type="default"
                        :disabled="batchRecordLoading || checkedImeis.length === 0" @click="handleCopyCheckedImeis">
                        复制IMEI{{ checkedImeis.length > 0 ? `（${checkedImeis.length}）` : "" }}
                      </n-button> -->
                      <n-button type="default" :disabled="batchRecordLoading || batchMockSessionActive"
                        @click="handleReset">
                        重置
                      </n-button>
                    </n-space>
                    <n-button v-if="batchMockSessionActive" type="default"
                      :disabled="batchRecordLoading || sharedBindDisabledByEnv"
                      @click="openBindAndOnlineModal" class="bind-online-right-btn">
                      共享-绑定并上架{{ resolvedBatchImeis.length > 0 ? `（${resolvedBatchImeis.length}）` : "" }}
                    </n-button>
                    <n-button v-if="batchMockSessionActive" type="default"
                      :disabled="batchRecordLoading || rentalBatchAddDisabledByEnv"
                      @click="openRentalBatchAddModal" class="rental-batch-add-right-btn">
                      短租-批量入库{{ resolvedBatchImeis.length > 0 ? `（${resolvedBatchImeis.length}）` : "" }}
                    </n-button>
                  </div>
                </n-form-item>
              </n-gi>
            </n-grid>
          </n-form>

          <n-alert v-if="requestError" class="result-block" type="error" :title="requestError" />

          <n-alert v-if="successSummary" class="result-block" type="success" :title="successSummary" />

          <div v-if="batchMockListRows.length > 0 && showDetailTable" class="result-block batch-mock-result-table">
            <div class="table-actions">
              <n-space :size="8" align="center" class="table-actions-left">
                <n-button size="small" quaternary type="primary" :disabled="batchRecordLoading"
                  @click="handleSelectAllRows">全选</n-button>
                <n-button size="small" quaternary :disabled="batchRecordLoading"
                  @click="handleInvertSelectedRows">反选</n-button>
              </n-space>
              <n-space :size="8" align="center" class="table-filters-right">
                <n-select v-model:value="tableSuccessFilter" size="small" :options="tableSuccessFilterOptions"
                  :disabled="batchRecordLoading" class="table-filter-select" />
                <n-input v-model:value="tableImeiKeyword" size="small" clearable :disabled="batchRecordLoading"
                  placeholder="输入IMEI模糊搜索" class="table-imei-search" />
              </n-space>
            </div>
            <n-data-table v-model:checked-row-keys="checkedRowKeys" :columns="batchMockTableColumns"
              :data="filteredBatchMockListRows" :row-key="batchMockRowKey" size="small" :pagination="{ pageSize: 1000 }"
              :max-height="520" striped bordered />
          </div>
        </div>
      </n-spin>
    </n-card>

    <n-modal v-model:show="envPickerShow" preset="card" :title="envPickerTitle" :mask-closable="true"
      class="env-picker-modal" style="width: 600px" @after-leave="onEnvPickerAfterLeave">
      <div class="env-picker-body">
        <!-- <p class="env-picker-hint">
          点击任意一行即可写入「设备网关」与环境标识并关闭窗口。环境较多时可用顶部搜索缩小范围，列表按页展示、无需在框内滚动。
        </p> -->
        <n-spin :show="envPickerLoading">
          <div v-if="!envPickerLoading && envPickerOptions.length === 0" class="env-picker-empty-wrap">
            <n-empty description="暂无可选环境" size="medium">
              <template #extra>
                <p class="env-picker-empty-tip">
                  <!-- 需配置 order，且网关字段有效（共享/海外：<code>ebike_target_addr</code>；短租：字段 <code>3</code>） -->
                </p>
              </template>
            </n-empty>
          </div>
          <div v-else-if="!envPickerLoading && envPickerNoMatch" class="env-picker-empty-wrap">
            <n-empty description="没有匹配的环境" size="medium">
              <template #extra>
                <p class="env-picker-empty-tip">可缩短关键字，或清空搜索框查看全部列表</p>
              </template>
            </n-empty>
          </div>
          <div v-else-if="!envPickerLoading" class="env-picker-list-panel">
            <div class="env-picker-toolbar">
              <n-input v-model:value="envPickerSearch" clearable size="small" placeholder="筛选：名称、环境 key、网关地址"
                class="env-picker-search-input" />
              <span class="env-picker-count">{{ envPickerFilteredTotal }} / {{ envPickerOptions.length }}</span>
            </div>
            <ul class="env-picker-list">
              <li v-for="item in envPickerPageItems" :key="item.value" class="env-picker-item" role="button"
                tabindex="0" @click="applyEnvFromPicker(item)" @keydown.enter.prevent="applyEnvFromPicker(item)">
                <div class="env-picker-item-top">
                  <span class="env-picker-name" :title="envPickerItemName(item)">{{ envPickerItemName(item) }}</span>
                  <n-tag size="small" :bordered="false" type="info" class="env-picker-key-tag">
                    {{ item.value }}
                  </n-tag>
                </div>
                <div class="env-picker-addr" :title="envPickerItemGateway(item)">{{ envPickerItemGateway(item) }}</div>
              </li>
            </ul>
            <div v-if="envPickerFilteredTotal > ENV_PICKER_PAGE_SIZE" class="env-picker-pagination-wrap">
              <n-pagination v-model:page="envPickerPage" :page-size="ENV_PICKER_PAGE_SIZE"
                :item-count="envPickerFilteredTotal" size="small" show-quick-jumper />
            </div>
          </div>
        </n-spin>
      </div>
    </n-modal>

    <n-modal v-model:show="bindAndOnlineShow" preset="card" title="批量绑定并上架" :mask-closable="!bindAndOnlineLoading"
      class="bind-online-modal" style="width: 680px">
      <n-form :model="bindAndOnlineForm" label-placement="left" label-width="110px">
        <n-form-item label="环境" required>
          <n-select v-model:value="bindAndOnlineForm.env" filterable clearable :loading="bindAndOnlineEnvLoading"
            :options="bindAndOnlineEnvOptions" placeholder="请选择环境" />
        </n-form-item>
        <n-form-item label="租户ID" required>
          <n-input v-model:value="bindAndOnlineForm.tenant_id" placeholder="请输入租户ID" clearable />
        </n-form-item>
        <n-form-item label="服务区" required>
          <n-select v-model:value="bindAndOnlineForm.service_area_id" filterable clearable
            :loading="bindAndOnlineServiceAreaLoading" :options="bindAndOnlineServiceAreaOptions"
            placeholder="请选择服务区" />
        </n-form-item>
        <n-form-item label="IMEI列表" required>
          <div class="bind-online-imeis-wrap">
            <n-input v-model:value="bindAndOnlineForm.imeis_text" type="textarea"
              :autosize="{ minRows: 6, maxRows: 14 }" placeholder="支持按换行、空格、逗号分隔 IMEI" clearable />
            <div class="bind-online-imeis-tip">
              已识别 {{ bindAndOnlineImeis.length }} 个有效 IMEI（15 位数字）
            </div>
          </div>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button :disabled="bindAndOnlineLoading" @click="bindAndOnlineShow = false">取消</n-button>
          <n-button type="primary" :loading="bindAndOnlineLoading" @click="handleBindAndOnlineSubmit">确认绑定并上架</n-button>
        </n-space>
      </template>
    </n-modal>

    <n-modal v-model:show="rentalBatchAddShow" preset="card" title="短租-批量入库" :mask-closable="!rentalBatchAddLoading"
      class="rental-batch-add-modal" style="width: 760px">
      <n-form :model="rentalBatchAddForm" label-placement="left" label-width="110px">
        <n-form-item label="环境" required>
          <n-select v-model:value="rentalBatchAddForm.env" filterable clearable :loading="rentalBatchAddEnvLoading"
            :options="rentalBatchAddEnvOptions" placeholder="请选择环境" />
        </n-form-item>
        <n-form-item label="租户" required>
          <n-select v-model:value="rentalBatchAddForm.tenant_id" filterable clearable
            :loading="rentalBatchAddTenantLoading" :options="rentalBatchAddTenantOptions" placeholder="请选择租户" />
        </n-form-item>
        <n-form-item label="加盟商" required>
          <n-select v-model:value="rentalBatchAddForm.custom_id" filterable clearable
            :loading="rentalBatchAddFranchiseeLoading" :options="rentalBatchAddFranchiseeOptions"
            placeholder="请选择加盟商" />
        </n-form-item>
        <n-form-item label="门店" required>
          <n-select v-model:value="rentalBatchAddForm.shop_id" filterable clearable :loading="rentalBatchAddShopLoading"
            :options="rentalBatchAddShopOptions" placeholder="请选择门店" />
        </n-form-item>
        <n-form-item label="车型" required>
          <n-select v-model:value="rentalBatchAddForm.vehicle_model_id" filterable clearable
            :loading="rentalBatchAddVehicleModelLoading" :options="rentalBatchAddVehicleModelOptions"
            placeholder="请选择车型" />
        </n-form-item>
        <n-form-item label="IMEI列表" required>
          <div class="bind-online-imeis-wrap">
            <n-input v-model:value="rentalBatchAddForm.imeis_text" type="textarea"
              :autosize="{ minRows: 6, maxRows: 14 }" placeholder="支持按换行、空格、逗号分隔 IMEI" clearable />
            <div class="bind-online-imeis-tip">
              已识别 {{ rentalBatchAddImeis.length }} 个有效 IMEI（15 位数字）
            </div>
          </div>
        </n-form-item>
      </n-form>
      <template #action>
        <n-space justify="end">
          <n-button :disabled="rentalBatchAddLoading" @click="rentalBatchAddShow = false">取消</n-button>
          <n-button type="primary" :loading="rentalBatchAddLoading" @click="handleRentalBatchAddSubmit">
            确认批量入库
          </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "XiaoanEcuMockBatch" });

import { computed, h, onMounted, reactive, ref, watch } from "vue";
import { createDiscreteApi, NButton, NIcon, NInputNumber, NTag, NTooltip, type DataTableColumns, type DataTableRowKey } from "naive-ui";
import { Trash, Plus } from "@vicons/tabler";
import {
  getEbikeEnvListAPI,
  getOverseaEnvListAPI,
  getRentalEnvListAPI,
  rentalBusinessBatchAddEbikeAPI,
  rentalBusinessFranchiseeAllAPI,
  rentalBusinessTenantAllAPI,
  rentalBusinessVehicleModelAllAPI,
  xiaoanEcuBatchBindAndOnlineAPI,
  xiaoanEcuServiceAreaAllAPI,
  xiaoanEcuMockBatchCreateAPI,
  xiaoanEcuMockBatchDeleteByGroupAPI,
  xiaoanEcuMockBatchGroupsAPI,
  xiaoanEcuMockBatchRecordAPI,
  xiaoanEcuMockUpdateAPI,
} from "@/api/device";
import {
  buildBatchPayload,
  REPLY_DELAY_MAX_SEC,
  formatCombinedCoordText,
  isFifteenDigitImei,
  parseCombinedCoordText,
  parseImeiLngLatCsv,
  parseCoordinatesText,
  parseImeisText,
  validateBatchForm,
  type BatchFormData,
} from "./xiaoan-ecu-mock-batch.service";

const { message, dialog } = createDiscreteApi(["message", "dialog"]);

const DEFAULT_COORD_LNG = 114.434888;
const DEFAULT_COORD_LAT = 30.500136;
const STORAGE_KEY = "XATTP_ECU_MOCK_BATCH_FORM";
const VOLTAGE_MIN = 0;
const VOLTAGE_MAX = 72;
type EnvSource = "ebike" | "rental" | "oversea";
type EnvRecord = Record<string, unknown>;

/** 批量创建接口 data.list 单行 */
interface BatchMockListRow {
  row_key: string;
  connect_id: string;
  imei: string;
  lat: number | null;
  lng: number | null;
  is_mock_success: boolean;
  voltage: number | null;
  error: string;
  bind_success: boolean | null;
  online_success: boolean | null;
  rental_add_success: boolean | null;
  biz_scene: "shared_bind_online" | "rental_batch_add" | null;
  car_id: string;
  create_datetime: string;
}

function parseBatchMockListFromResponse(res: unknown): BatchMockListRow[] {
  const r = res as { data?: { list?: unknown } } | null;
  const raw = r?.data?.list;
  if (!Array.isArray(raw)) return [];
  const out: BatchMockListRow[] = [];
  for (let i = 0; i < raw.length; i += 1) {
    const item = raw[i];
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const connect_id = typeof row.connect_id === "string" ? row.connect_id.trim() : "";
    const imei = typeof row.imei === "string" ? row.imei.trim() : "";
    const is_mock_success = Boolean(row.is_mock_success);
    const error = typeof row.error === "string" ? row.error.trim() : "";
    const row_key = connect_id || `${imei || "unknown"}__${is_mock_success ? "success" : "fail"}__${i}`;
    out.push({
      row_key,
      connect_id,
      imei,
      lat: typeof row.lat === "number" && Number.isFinite(row.lat) ? row.lat : null,
      lng: typeof row.lng === "number" && Number.isFinite(row.lng) ? row.lng : null,
      is_mock_success,
      voltage: typeof row.voltage === "number" && Number.isFinite(row.voltage) ? row.voltage : null,
      error,
      bind_success: null,
      online_success: null,
      rental_add_success: null,
      biz_scene: null,
      car_id: "",
      create_datetime: typeof row.create_datetime === "string" ? row.create_datetime.trim() : "",
    });
  }
  return out.sort((a, b) => a.imei.localeCompare(b.imei, "en", { numeric: true }));
}

/** 历史兼容：旧接口返回 data 为 list[] 或 [{ list: [] }] */
function parseBatchMockListFromLegacyRecordResponse(res: unknown): BatchMockListRow[] {
  const root = res as { data?: unknown } | null;
  const data = root?.data;
  if (!Array.isArray(data)) return [];
  const rows: BatchMockListRow[] = [];
  for (const item of data) {
    if (!item) continue;
    if (Array.isArray(item)) {
      rows.push(...parseBatchMockListFromResponse({ data: { list: item } }));
      continue;
    }
    if (typeof item === "object") {
      const obj = item as Record<string, unknown>;
      if (Array.isArray(obj.list)) {
        rows.push(...parseBatchMockListFromResponse({ data: { list: obj.list } }));
      } else if (obj.connect_id) {
        rows.push(...parseBatchMockListFromResponse({ data: { list: [obj] } }));
      }
    }
  }
  const successDedup = new Map<string, BatchMockListRow>();
  const failedRows: BatchMockListRow[] = [];
  rows.forEach((r) => {
    if (r.connect_id) {
      successDedup.set(r.connect_id, r);
      return;
    }
    failedRows.push(r);
  });
  return [...Array.from(successDedup.values()), ...failedRows].sort((a, b) =>
    a.imei.localeCompare(b.imei, "en", { numeric: true }),
  );
}

interface EnvOption {
  label: string;
  value: string;
  order: number;
  record: EnvRecord;
}
const ENV_GROUP_LABEL: Record<EnvSource, string> = {
  ebike: "共享",
  rental: "短租",
  oversea: "海外",
};
const BUSINESS_TYPE_BY_SOURCE: Record<EnvSource, 1 | 2 | 3> = {
  ebike: 1,
  rental: 2,
  oversea: 3,
};
const businessTypeOptions = [
  { label: "共享（1）", value: 1 },
  { label: "短租（2）", value: 2 },
  { label: "海外（3）", value: 3 },
] as const;

const defaultFormData: BatchFormData = {
  env: "test2",
  server: "",
  tenant_id: "",
  business_type: null,
  voltage_min: 50,
  voltage_max: 54,
  lat: DEFAULT_COORD_LAT,
  lng: DEFAULT_COORD_LNG,
  coord_combined_text: `${DEFAULT_COORD_LNG},${DEFAULT_COORD_LAT}`,
  radius_m: 10000,
  random_move_m: 0,
  coord_mode: "scatter",
  mode: 2,
  create_mode: 1,
  serial_interval_ms: 10,
  reply_delay_sec: 0,
  enable_scheduled_report: true,
  immediate_start_riding: false,
  num: 10,
  start_imei: "",
  imeis_text: "",
  coordinates_text: "",
};

function getInitialFormData(): BatchFormData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultFormData };
    const parsed = JSON.parse(raw) as Partial<BatchFormData> & { voltage?: number };
    const merged: BatchFormData = {
      ...defaultFormData,
      ...parsed,
    };
    if (
      (merged.voltage_min == null || merged.voltage_max == null) &&
      typeof parsed.voltage === "number" &&
      !Number.isNaN(parsed.voltage)
    ) {
      merged.voltage_min = Math.trunc(parsed.voltage);
      merged.voltage_max = Math.trunc(parsed.voltage);
    }
    // 缓存里缺省或非法电压时，使用表单初始默认 50–54（避免 null 被规范成 0–0）
    if (
      merged.voltage_min == null ||
      merged.voltage_max == null ||
      !Number.isFinite(Number(merged.voltage_min)) ||
      !Number.isFinite(Number(merged.voltage_max))
    ) {
      merged.voltage_min = defaultFormData.voltage_min;
      merged.voltage_max = defaultFormData.voltage_max;
    }
    const clamped = normalizeVoltagePair(merged.voltage_min, merged.voltage_max);
    merged.voltage_min = clamped[0];
    merged.voltage_max = clamped[1];
    // 随机半径默认 10000（m）；缓存缺省或非法时回退，0 表示不随机仍保留
    if (merged.radius_m == null || !Number.isFinite(Number(merged.radius_m)) || Number(merged.radius_m) < 0) {
      merged.radius_m = defaultFormData.radius_m;
    }
    if (
      merged.random_move_m == null ||
      !Number.isFinite(Number(merged.random_move_m)) ||
      Number(merged.random_move_m) < 0
    ) {
      merged.random_move_m = defaultFormData.random_move_m;
    }
    if (merged.coord_mode !== "scatter" && merged.coord_mode !== "fixed") {
      merged.coord_mode = defaultFormData.coord_mode;
    }
    if (typeof merged.coord_combined_text !== "string" || !merged.coord_combined_text.trim()) {
      merged.coord_combined_text = formatCombinedCoordText(merged.lng, merged.lat) || defaultFormData.coord_combined_text;
    }
    if (merged.create_mode !== 1 && merged.create_mode !== 2) {
      merged.create_mode = defaultFormData.create_mode;
    }
    if (
      merged.serial_interval_ms == null ||
      !Number.isFinite(Number(merged.serial_interval_ms)) ||
      Number(merged.serial_interval_ms) < 0
    ) {
      merged.serial_interval_ms = defaultFormData.serial_interval_ms;
    } else {
      merged.serial_interval_ms = Math.trunc(Number(merged.serial_interval_ms));
    }
    if (
      merged.reply_delay_sec == null ||
      !Number.isFinite(Number(merged.reply_delay_sec)) ||
      Number(merged.reply_delay_sec) < 0
    ) {
      merged.reply_delay_sec = defaultFormData.reply_delay_sec;
    } else {
      merged.reply_delay_sec = Math.min(
        REPLY_DELAY_MAX_SEC,
        Math.max(0, Math.trunc(Number(merged.reply_delay_sec))),
      );
    }
    if (typeof merged.enable_scheduled_report !== "boolean") {
      merged.enable_scheduled_report = defaultFormData.enable_scheduled_report;
    }
    if (typeof merged.immediate_start_riding !== "boolean") {
      merged.immediate_start_riding = defaultFormData.immediate_start_riding;
    }
    return merged;
  } catch {
    return { ...defaultFormData };
  }
}

const formData = reactive<BatchFormData>(getInitialFormData());
const numInputStr = ref(
  formData.num != null && Number.isFinite(Number(formData.num)) ? String(Math.trunc(Number(formData.num))) : "",
);
const voltageSlider = ref<[number, number]>([
  Math.min(Number(formData.voltage_min ?? 0), Number(formData.voltage_max ?? 0)),
  Math.max(Number(formData.voltage_min ?? 0), Number(formData.voltage_max ?? 0)),
]);
const createLoading = ref(false);
const stopMockLoading = ref(false);
const removingSessionId = ref("");
const requestError = ref("");
const successSummary = ref("");
const batchMockListRows = ref<BatchMockListRow[]>([]);
const showDetailTable = ref(true);
const checkedRowKeys = ref<DataTableRowKey[]>([]);
const checkedImeis = computed(() =>
  batchMockListRows.value
    .filter((row) => checkedRowKeys.value.includes(row.row_key))
    .map((row) => row.imei)
    .filter((imei) => /^\d{15}$/.test(imei)),
);

/**
 * 解析本次要操作的 IMEI 列表：
 * 1. 优先取表格勾选行；
 * 2. 无勾选（如表格为空）时按当前批次的 IMEI 规则推导：
 *    - 顺序模式：起始 IMEI 起递增「创建数量」个
 *    - 指定模式：IMEI 列表文本
 *    - 随机模式：由后端生成，无法在前端推导，返回空
 */
const resolvedBatchImeis = computed<string[]>(() => {
  const checked = Array.from(new Set(checkedImeis.value));
  if (checked.length > 0) return checked;
  // 表格有数据却未勾选，视为用户主动取消，不回填
  if (batchMockListRows.value.length > 0) return [];
  if (formData.mode === 2 && isFifteenDigitImei(formData.start_imei)) {
    const count = Math.trunc(Number(formData.num));
    const start = Number(formData.start_imei);
    if (Number.isFinite(start) && count > 0) {
      return Array.from({ length: count }, (_, i) => String(start + i).padStart(15, "0"));
    }
  }
  if (formData.mode === 3) {
    return Array.from(new Set(parseImeisText(formData.imeis_text))).filter((imei) => isFifteenDigitImei(imei));
  }
  return [];
});
const tableSuccessFilter = ref<"all" | "success" | "fail">("all");
/** 顺序模式下，下一次批量新增的起始 IMEI（自动 = 之前的 start_imei + num） */
const nextSequentialStartImei = ref("");
const tableSuccessFilterOptions = [
  { label: "全部", value: "all" },
  { label: "仅成功", value: "success" },
  { label: "仅失败", value: "fail" },
] as const;
const tableImeiKeyword = ref("");
const filteredBatchMockListRows = computed(() => {
  const kw = tableImeiKeyword.value.trim();
  let rows = batchMockListRows.value;
  if (tableSuccessFilter.value === "success") {
    rows = rows.filter((row) => row.is_mock_success);
  } else if (tableSuccessFilter.value === "fail") {
    rows = rows.filter((row) => !row.is_mock_success);
  }
  if (kw) {
    rows = rows.filter((row) => row.imei.includes(kw));
  }
  return rows;
});
interface BindAndOnlineFormData {
  env: string;
  tenant_id: string;
  service_area_id: string;
  imeis_text: string;
}

interface RentalBatchAddFormData {
  env: string;
  tenant_id: string;
  tenant_name: string;
  custom_id: string;
  shop_id: string;
  vehicle_model_id: string;
  imeis_text: string;
}

const bindAndOnlineShow = ref(false);
const bindAndOnlineLoading = ref(false);
const bindAndOnlineEnvLoading = ref(false);
const bindAndOnlineEnvOptions = ref<Array<{ label: string; value: string }>>([]);
const bindAndOnlineServiceAreaLoading = ref(false);
const bindAndOnlineServiceAreaOptions = ref<Array<{ label: string; value: string }>>([]);
const bindAndOnlineForm = reactive<BindAndOnlineFormData>({
  env: "",
  tenant_id: "",
  service_area_id: "",
  imeis_text: "",
});
const bindAndOnlineImeis = computed(() =>
  Array.from(new Set(parseImeisText(bindAndOnlineForm.imeis_text))).filter((imei) => isFifteenDigitImei(imei)),
);
const rentalBatchAddShow = ref(false);
const rentalBatchAddLoading = ref(false);
const rentalBatchAddEnvLoading = ref(false);
const rentalBatchAddTenantLoading = ref(false);
const rentalBatchAddFranchiseeLoading = ref(false);
const rentalBatchAddShopLoading = ref(false);
const rentalBatchAddVehicleModelLoading = ref(false);
const rentalBatchAddEnvOptions = ref<Array<{ label: string; value: string }>>([]);
const rentalBatchAddTenantOptions = ref<Array<{ label: string; value: string }>>([]);
const rentalBatchAddFranchiseeOptions = ref<Array<{ label: string; value: string }>>([]);
const rentalBatchAddShopOptions = ref<Array<{ label: string; value: string }>>([]);
const rentalBatchAddVehicleModelOptions = ref<Array<{ label: string; value: string }>>([]);
const rentalBatchAddForm = reactive<RentalBatchAddFormData>({
  env: "",
  tenant_id: "",
  tenant_name: "",
  custom_id: "",
  shop_id: "",
  vehicle_model_id: "",
  imeis_text: "",
});
const rentalBatchAddImeis = computed(() =>
  Array.from(new Set(parseImeisText(rentalBatchAddForm.imeis_text))).filter((imei) => isFifteenDigitImei(imei)),
);
const rentalFranchiseeShopMap = ref<Record<string, Array<{ label: string; value: string }>>>({});
const currentCreateEnvSource = ref<EnvSource | null>(null);
const showSharedBindCol = ref(false);
const showRentalBatchAddCol = ref(false);

/* ========== 多批次 Session 管理 ========== */
const SESSIONS_STORAGE_KEY = "XATTP_ECU_MOCK_BATCH_SESSIONS_NEW";

interface BatchSessionMeta {
  id: string;
  batch_group: string;
  createDatetime: string;
  env: string;
  business_type: 1 | 2 | 3 | null;
  rows: BatchMockListRow[];
  /** 批次总数量，无明细列表时替代 rows.length */
  batchCount: number;
  /** 保存快照 */
  formDataSnapshot: BatchFormData;
  successSummary: string;
  requestError: string;
  showSharedBindCol: boolean;
  showRentalBatchAddCol: boolean;
  showDetailTable: boolean;
  checkedRowKeys: string[];
  currentCreateEnvSource: EnvSource | null;
  numInputStr: string;
  voltageSlider: [number, number];
}

const batchSessions = ref<BatchSessionMeta[]>([]);
const activeSessionId = ref("");

function generateSessionId(): string {
  return `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatBusinessType(bt: 1 | 2 | 3 | null): string {
  if (bt === 1) return "共享";
  if (bt === 2) return "短租";
  if (bt === 3) return "海外";
  return "-";
}

function formatBatchMode(mode: number | null | undefined): string {
  if (mode === 1) return "随机";
  if (mode === 2) return "顺序";
  if (mode === 3) return "指定";
  return "-";
}

function getEndImei(session: BatchSessionMeta): string {
  const start = session.formDataSnapshot.start_imei;
  const count = session.batchCount ?? session.rows.length;
  if (!start || count <= 0) return "";
  return String(Number(start) + count - 1).padStart(15, "0");
}

function copyImeiRange(session: BatchSessionMeta) {
  const start = session.formDataSnapshot.start_imei;
  const end = getEndImei(session);
  const text = start && end ? `${start}-${end}` : "";
  if (!text || !navigator?.clipboard) return;
  navigator.clipboard.writeText(text).then(
    () => message.success("已复制 IMEI 范围"),
    () => {},
  );
}

function formatRelativeCreateAt(createAt?: string): string {
  if (!createAt || typeof createAt !== "string") return "-";
  const createMs = Date.parse(createAt.replace(/-/g, "/"));
  if (Number.isNaN(createMs)) return "-";
  const diffSec = Math.max(0, Math.floor((Date.now() - createMs) / 1000));
  if (diffSec < 60) return "刚刚";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
}

function getFirstSpecifiedImei(session: BatchSessionMeta): string {
  const text = session.formDataSnapshot.imeis_text || "";
  if (!text) return "";
  const imeis = text.split(/[\s,，;；]+/).map((s) => s.trim()).filter(Boolean);
  return imeis[0] || "";
}

function saveCurrentSessionToActive() {
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  if (!session) return;
  session.formDataSnapshot = { ...formData };
  session.rows = [...batchMockListRows.value];
  session.successSummary = successSummary.value;
  session.requestError = requestError.value;
  session.showSharedBindCol = showSharedBindCol.value;
  session.showRentalBatchAddCol = showRentalBatchAddCol.value;
  session.showDetailTable = showDetailTable.value;
  session.checkedRowKeys = [...checkedRowKeys.value];
  session.currentCreateEnvSource = currentCreateEnvSource.value;
  session.numInputStr = numInputStr.value;
  session.voltageSlider = [...voltageSlider.value];
  saveSessionsToStorage();
}

function loadSessionIntoUI(session: BatchSessionMeta) {
  Object.assign(formData, session.formDataSnapshot);
  batchMockListRows.value = session.rows;
  successSummary.value = session.successSummary;
  requestError.value = session.requestError;
  showSharedBindCol.value = session.showSharedBindCol;
  showRentalBatchAddCol.value = session.showRentalBatchAddCol;
  showDetailTable.value = session.showDetailTable;
  checkedRowKeys.value = session.checkedRowKeys;
  currentCreateEnvSource.value = session.currentCreateEnvSource;
  numInputStr.value = session.numInputStr;
  voltageSlider.value = [...session.voltageSlider];
  activeSessionId.value = session.id;
}

function switchToSession(targetId: string) {
  if (targetId === activeSessionId.value) return;
  saveCurrentSessionToActive();
  const target = batchSessions.value.find((s) => s.id === targetId);
  if (target) {
    loadSessionIntoUI(target);
  }
}

function handleSessionTabChange(targetId: string) {
  switchToSession(targetId);
}

function handleAddBatchTab() {
  if (batchMockListRows.value.length > 0 || formData.server?.trim() || formData.env?.trim()) {
    saveCurrentSessionToActive();
  }
  const prevForm = { ...formData };
  // 顺序模式自动递进起始 IMEI：新的 tab 从 start_imei + num 开始
  if (prevForm.mode === 2 && /^\d{15}$/.test(prevForm.start_imei) && Number(prevForm.num) > 0) {
    const nextImei = String(Number(prevForm.start_imei) + Number(prevForm.num)).padStart(15, "0");
    if (/^\d{15}$/.test(nextImei)) {
      formData.start_imei = nextImei;
      prevForm.start_imei = nextImei;
    }
  }
  nextSequentialStartImei.value = "";
  // 新增 tab 清空模式专属输入字段，不沿用旧数据
  prevForm.imeis_text = "";
  prevForm.coordinates_text = "";
  if (prevForm.mode !== 2) prevForm.start_imei = "";
  // UI 也同步清空
  formData.imeis_text = "";
  formData.coordinates_text = "";
  if (formData.mode !== 2) formData.start_imei = "";
  numInputStr.value = prevForm.num != null && Number.isFinite(Number(prevForm.num)) ? String(Math.trunc(Number(prevForm.num))) : "";
  batchMockListRows.value = [];
  checkedRowKeys.value = [];
  requestError.value = "";
  successSummary.value = "";
  showSharedBindCol.value = false;
  showRentalBatchAddCol.value = false;
  const newId = generateSessionId();
  const newSession: BatchSessionMeta = {
    id: newId,
    batch_group: "",
    createDatetime: new Date().toISOString().replace("T", " ").slice(0, 19),
    env: prevForm.env || "",
    business_type: prevForm.business_type,
    rows: [],
    batchCount: Number(prevForm.num) || 0,
    formDataSnapshot: { ...prevForm },
    successSummary: "",
    requestError: "",
    showSharedBindCol: false,
    showRentalBatchAddCol: false,
    showDetailTable: true,
      checkedRowKeys: [],
    currentCreateEnvSource: currentCreateEnvSource.value,
    numInputStr: numInputStr.value,
    voltageSlider: [prevForm.voltage_min ?? 0, prevForm.voltage_max ?? 0],
  };
  batchSessions.value.push(newSession);
  activeSessionId.value = newId;
  saveSessionsToStorage();
}

/** 从 API 返回的批次分组数据创建 session */
function createSessionFromApiGroup(group: any): BatchSessionMeta {
  const newId = generateSessionId();
  const rows = parseBatchMockListFromResponse({ data: { list: group.list } });
  const mergedRows = rows.length > 0 ? rows : parseBatchMockListFromLegacyRecordResponse({ data: group.list });
  const firstRecord = mergedRows[0] || null;
  const firstRaw = group.list?.[0] || {};

  // 优先使用后端保存的表单快照（完整还原）
  let formSnapshot: BatchFormData;
  if (group.form_snapshot) {
    let snap: any;
    try {
      snap = typeof group.form_snapshot === "string" ? JSON.parse(group.form_snapshot) : group.form_snapshot;
    } catch {
      snap = null;
    }
    if (snap) {
      const snapCoords = Array.isArray(snap.coordinates) ? snap.coordinates : [];
      formSnapshot = {
        env: snap.env ?? group.env ?? "",
        server: snap.server ?? String(firstRaw.server || firstRecord?.server || "") ?? "",
        tenant_id: snap.tenant_id ?? firstRecord?.tenant_id ?? "",
        business_type: snap.business_type ?? group.business_type,
        voltage_min: snap.voltage_min ?? 50,
        voltage_max: snap.voltage_max ?? 54,
        lat: snap.lat ?? firstRecord?.lat ?? DEFAULT_COORD_LAT,
        lng: snap.lng ?? firstRecord?.lng ?? DEFAULT_COORD_LNG,
        coord_combined_text: snap.coord_mode === "scatter"
          ? `${snap.lng ?? firstRecord?.lng ?? DEFAULT_COORD_LNG},${snap.lat ?? firstRecord?.lat ?? DEFAULT_COORD_LAT}`
          : `${DEFAULT_COORD_LNG},${DEFAULT_COORD_LAT}`,
        radius_m: snap.radius_m ?? 10000,
        random_move_m: snap.random_move_m ?? 0,
        coord_mode: snap.coord_mode === "fixed" ? "fixed" : "scatter",
        mode: snap.mode === 1 || snap.mode === 2 || snap.mode === 3 ? snap.mode as 1 | 2 | 3 : 1,
        create_mode: snap.create_mode === 2 ? 2 : 1,
        serial_interval_ms: snap.serial_interval_ms ?? 10,
        reply_delay_sec: snap.reply_delay_sec ?? 0,
        enable_scheduled_report: snap.enable_scheduled_report !== false,
        immediate_start_riding: snap.immediate_start_riding === true,
        num: snap.num ?? mergedRows.length,
        start_imei: snap.start_imei ?? group.start_imei ?? firstRaw.start_imei ?? "",
        imeis_text: Array.isArray(snap.imeis) ? snap.imeis.join("\n") : "",
        coordinates_text: snapCoords.length > 0 ? snapCoords.map((c: any) => `${c.lng},${c.lat}`).join("\n") : "",
      };
    } else {
      formSnapshot = buildCompatSnapshot();
    }
  } else {
    formSnapshot = buildCompatSnapshot();
  }

  /** 从 group 部分字段重建快照（兼容 form_snapshot 不存在的旧数据） */
  function buildCompatSnapshot(): BatchFormData {
    const groupMode = group.mode != null ? Number(group.mode) : 1;
    return {
      env: group.env || "",
      server: group.server || "",
      tenant_id: group.tenant_id || "",
      business_type: group.business_type,
      voltage_min: 50,
      voltage_max: 54,
      lat: firstRecord?.lat || DEFAULT_COORD_LAT,
      lng: firstRecord?.lng || DEFAULT_COORD_LNG,
      coord_combined_text: `${firstRecord?.lng || DEFAULT_COORD_LNG},${firstRecord?.lat || DEFAULT_COORD_LAT}`,
      radius_m: 10000,
      random_move_m: 0,
      coord_mode: "scatter",
      mode: groupMode === 1 || groupMode === 2 || groupMode === 3 ? groupMode as 1 | 2 | 3 : 1,
      create_mode: 1,
      serial_interval_ms: 10,
      reply_delay_sec: 0,
      enable_scheduled_report: true,
      immediate_start_riding: false,
      num: mergedRows.length,
      start_imei: group.start_imei || firstRaw.start_imei || "",
      imeis_text: "",
      coordinates_text: "",
    };
  }
  return {
    id: newId,
    batch_group: group.batch_group || "",
    createDatetime: group.create_datetime || new Date().toISOString().replace("T", " ").slice(0, 19),
    env: formSnapshot.env || "",
    business_type: formSnapshot.business_type,
    rows: mergedRows,
    batchCount: group.count ?? mergedRows.length,
    formDataSnapshot: formSnapshot,
    successSummary: "",
    requestError: "",
    showSharedBindCol: false,
    showRentalBatchAddCol: false,
    showDetailTable: true,
      checkedRowKeys: mergedRows.map((r) => r.row_key),
    currentCreateEnvSource: null,
    numInputStr:
      formSnapshot.num != null && Number.isFinite(Number(formSnapshot.num))
        ? String(Math.trunc(Number(formSnapshot.num)))
        : "",
    voltageSlider: [0, 0],
  };
}

async function handleRemoveSession(sessionId: string) {
  const idx = batchSessions.value.findIndex((s) => s.id === sessionId);
  if (idx === -1) return;
  removingSessionId.value = sessionId;
  const session = batchSessions.value[idx];
  const wasActive = sessionId === activeSessionId.value;

  // 停止该批次所有模拟中控
  const batchGroup = session.batch_group?.trim();
  if (batchGroup) {
    try {
      await xiaoanEcuMockBatchDeleteByGroupAPI({
        batch_group: batchGroup,
      });
    } catch {
      // 停止失败不影响删除
    }
  }

  batchSessions.value.splice(idx, 1);
  if (batchSessions.value.length === 0) {
    // 恢复最近一次表单缓存，而不是清空
    const cached = getInitialFormData();
    Object.assign(formData, cached);
    numInputStr.value =
      formData.num != null && Number.isFinite(Number(formData.num))
        ? String(Math.trunc(Number(formData.num)))
        : "";
    syncVoltageSliderFromForm();
    batchMockListRows.value = [];
    checkedRowKeys.value = [];
    requestError.value = "";
    successSummary.value = "";
    showSharedBindCol.value = false;
    showRentalBatchAddCol.value = false;
    showDetailTable.value = true;
    currentCreateEnvSource.value = null;
    activeSessionId.value = "";
  } else if (wasActive) {
    const next = batchSessions.value[Math.min(idx, batchSessions.value.length - 1)];
    loadSessionIntoUI(next);
  }
  saveSessionsToStorage();
  removingSessionId.value = "";
}

function saveSessionsToStorage() {
  try {
    const data = batchSessions.value.map((s) => ({
      ...s,
      rows: s.rows,
      formDataSnapshot: s.formDataSnapshot,
      checkedRowKeys: s.checkedRowKeys,
      voltageSlider: s.voltageSlider,
    }));
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 忽略存储失败
  }
}

function loadSessionsFromStorage() {
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as BatchSessionMeta[];
    if (!Array.isArray(parsed) || parsed.length === 0) return;
    batchSessions.value = parsed.map((s) => ({
      ...s,
      batch_group: (s as any).batch_group || "",
      rows: Array.isArray(s.rows) ? s.rows : [],
      checkedRowKeys: Array.isArray(s.checkedRowKeys) ? s.checkedRowKeys : [],
      voltageSlider: Array.isArray(s.voltageSlider) && s.voltageSlider.length === 2 ? s.voltageSlider : [0, 0],
    }));
    const first = batchSessions.value[0];
    if (first) {
      loadSessionIntoUI(first);
    }
  } catch {
    // 忽略加载失败
  }
}

/** 从后端 API 加载批次分组 */
async function loadBatchGroupsFromApi() {
  batchGroupsLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockBatchGroupsAPI();
    if (res != null && Number(res.code) !== 0) return;
    const groups = Array.isArray(res?.data) ? res.data : [];
    if (groups.length === 0) return;
    const sessions = groups.map((g: any) => createSessionFromApiGroup(g)).reverse();
    // 合并：已有 localStorage session 优先保留，不覆盖
    const existingIds = new Set(batchSessions.value.map((s) => s.id));
    const newSessions = sessions.filter((s) => !existingIds.has(s.id));
    if (newSessions.length === 0) return;
    batchSessions.value = [...batchSessions.value, ...newSessions];
    if (!activeSessionId.value && newSessions.length > 0) {
      loadSessionIntoUI(newSessions[0]);
    }
    saveSessionsToStorage();
  } catch {
    // 忽略
  } finally {
    batchGroupsLoading.value = false;
  }
}

async function loadBindAndOnlineEnvOptions() {
  bindAndOnlineEnvLoading.value = true;
  try {
    const source: EnvSource = "ebike";
    const result = await fetchEnvListForSource(source);
    if (result.error) {
      message.error(result.error);
    }
    // 复用“共享”环境接口的顺序与过滤，仅调整展示文案为 name(id)
    const list = result.options.map((item) => {
      const name = typeof item.record.name === "string" && item.record.name.trim() ? item.record.name.trim() : item.value;
      return {
        label: `${name}(${item.value})`,
        value: item.value,
      };
    });
    bindAndOnlineEnvOptions.value = list;
    const currentEnv = bindAndOnlineForm.env.trim();
    if (currentEnv && !list.some((item) => item.value === currentEnv)) {
      bindAndOnlineEnvOptions.value = [{ label: `${currentEnv}（当前）`, value: currentEnv }, ...list];
    }
  } finally {
    bindAndOnlineEnvLoading.value = false;
  }
}

async function loadBindAndOnlineServiceAreaOptions() {
  const env = bindAndOnlineForm.env.trim();
  const tenantId = bindAndOnlineForm.tenant_id.trim();
  if (!env || !tenantId) {
    bindAndOnlineServiceAreaOptions.value = [];
    bindAndOnlineForm.service_area_id = "";
    return;
  }
  bindAndOnlineServiceAreaLoading.value = true;
  try {
    const res: any = await xiaoanEcuServiceAreaAllAPI({ tenant_id: tenantId, env });
    if (res != null && Number(res.code) !== 0) {
      bindAndOnlineServiceAreaOptions.value = [];
      bindAndOnlineForm.service_area_id = "";
      message.error(res?.msg || "获取服务区失败");
      return;
    }
    const list = Array.isArray(res?.data) ? res.data : [];
    const options = list
      .filter((item: any) => item && Number(item.carType) === 0)
      .map((item: any) => {
        const id = String(item.id ?? "").trim();
        const name = String(item.name ?? "").trim();
        return { label: `${name || id}(${id})`, value: id };
      })
      .filter((item: { label: string; value: string }) => !!item.value);
    bindAndOnlineServiceAreaOptions.value = options;
    if (!options.some((item) => item.value === bindAndOnlineForm.service_area_id)) {
      bindAndOnlineForm.service_area_id = "";
    }
  } catch (error: any) {
    bindAndOnlineServiceAreaOptions.value = [];
    bindAndOnlineForm.service_area_id = "";
    message.error(error?.message || String(error) || "获取服务区失败");
  } finally {
    bindAndOnlineServiceAreaLoading.value = false;
  }
}

function extractIdAndName(
  item: Record<string, unknown>,
  idKeys: string[],
  nameKeys: string[],
): { id: string; name: string } {
  const id = idKeys
    .map((key) => String(item[key] ?? "").trim())
    .find((value) => !!value) || "";
  const name =
    nameKeys
      .map((key) => String(item[key] ?? "").trim())
      .find((value) => !!value) || id;
  return { id, name };
}

function parseShopOptionsFromFranchisee(franchisee: Record<string, unknown>): Array<{ label: string; value: string }> {
  const candidateKeys = ["shopList", "shop_list", "shops", "storeList", "store_list", "shopInfos"];
  const raw = candidateKeys
    .map((key) => franchisee[key])
    .find((value) => Array.isArray(value)) as unknown[] | undefined;
  if (!raw) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const { id, name } = extractIdAndName(
        obj,
        ["id", "shopId", "shop_id", "storeId", "store_id"],
        ["name", "shopName", "shop_name", "storeName", "store_name"],
      );
      if (!id) return null;
      return { label: `${name}(${id})`, value: id };
    })
    .filter((item): item is { label: string; value: string } => item != null);
}

async function loadRentalBatchAddEnvOptions() {
  rentalBatchAddEnvLoading.value = true;
  try {
    const result = await fetchEnvListForSource("rental");
    if (result.error) {
      message.error(result.error);
    }
    const list = result.options.map((item) => {
      const name = typeof item.record.name === "string" && item.record.name.trim() ? item.record.name.trim() : item.value;
      return { label: `${name}(${item.value})`, value: item.value };
    });
    rentalBatchAddEnvOptions.value = list;
    const currentEnv = rentalBatchAddForm.env.trim();
    if (currentEnv && !list.some((item) => item.value === currentEnv)) {
      rentalBatchAddEnvOptions.value = [{ label: `${currentEnv}（当前）`, value: currentEnv }, ...list];
    }
  } finally {
    rentalBatchAddEnvLoading.value = false;
  }
}

async function loadRentalBatchAddTenantOptions() {
  const env = rentalBatchAddForm.env.trim();
  if (!env) {
    rentalBatchAddTenantOptions.value = [];
    rentalBatchAddForm.tenant_id = "";
    rentalBatchAddForm.tenant_name = "";
    return;
  }
  rentalBatchAddTenantLoading.value = true;
  try {
    const res: any = await rentalBusinessTenantAllAPI({ env });
    if (res != null && Number(res.code) !== 0) {
      rentalBatchAddTenantOptions.value = [];
      rentalBatchAddForm.tenant_id = "";
      rentalBatchAddForm.tenant_name = "";
      message.error(res?.msg || "获取租户失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(
          obj,
          ["tenantId", "tenant_id", "id"],
          ["tenantName", "tenant_name", "name"],
        );
        if (!id) return null;
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    rentalBatchAddTenantOptions.value = options;
    if (!options.some((item: any) => item.value === rentalBatchAddForm.tenant_id)) {
      rentalBatchAddForm.tenant_id = "";
      rentalBatchAddForm.tenant_name = "";
    } else {
      const selected = options.find((item: any) => item.value === rentalBatchAddForm.tenant_id);
      rentalBatchAddForm.tenant_name = selected?.label?.replace(/\([^)]*\)\s*$/, "") || "";
    }
  } catch (error: any) {
    rentalBatchAddTenantOptions.value = [];
    rentalBatchAddForm.tenant_id = "";
    rentalBatchAddForm.tenant_name = "";
    message.error(error?.message || String(error) || "获取租户失败");
  } finally {
    rentalBatchAddTenantLoading.value = false;
  }
}

async function loadRentalBatchAddFranchiseeOptions() {
  const env = rentalBatchAddForm.env.trim();
  const tenantId = rentalBatchAddForm.tenant_id.trim();
  if (!env || !tenantId) {
    rentalBatchAddFranchiseeOptions.value = [];
    rentalBatchAddForm.custom_id = "";
    rentalBatchAddShopOptions.value = [];
    rentalBatchAddForm.shop_id = "";
    rentalFranchiseeShopMap.value = {};
    return;
  }
  rentalBatchAddFranchiseeLoading.value = true;
  try {
    const res: any = await rentalBusinessFranchiseeAllAPI({ env, tenant_id: tenantId });
    if (res != null && Number(res.code) !== 0) {
      rentalBatchAddFranchiseeOptions.value = [];
      rentalBatchAddForm.custom_id = "";
      rentalBatchAddShopOptions.value = [];
      rentalBatchAddForm.shop_id = "";
      rentalFranchiseeShopMap.value = {};
      message.error(res?.msg || "获取加盟商失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const shopMap: Record<string, Array<{ label: string; value: string }>> = {};
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(
          obj,
          ["customId", "custom_id", "id", "agentId", "agent_id"],
          ["customName", "custom_name", "name", "agentName", "agent_name"],
        );
        if (!id) return null;
        shopMap[id] = parseShopOptionsFromFranchisee(obj);
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    rentalFranchiseeShopMap.value = shopMap;
    rentalBatchAddFranchiseeOptions.value = options;
    if (!options.some((item: any) => item.value === rentalBatchAddForm.custom_id)) {
      rentalBatchAddForm.custom_id = "";
    }
  } catch (error: any) {
    rentalBatchAddFranchiseeOptions.value = [];
    rentalBatchAddForm.custom_id = "";
    rentalBatchAddShopOptions.value = [];
    rentalBatchAddForm.shop_id = "";
    rentalFranchiseeShopMap.value = {};
    message.error(error?.message || String(error) || "获取加盟商失败");
  } finally {
    rentalBatchAddFranchiseeLoading.value = false;
  }
}

function refreshRentalBatchAddShopOptions() {
  const customId = rentalBatchAddForm.custom_id.trim();
  const list = customId ? rentalFranchiseeShopMap.value[customId] || [] : [];
  rentalBatchAddShopOptions.value = list;
  if (!list.some((item) => item.value === rentalBatchAddForm.shop_id)) {
    rentalBatchAddForm.shop_id = "";
  }
}

async function loadRentalBatchAddVehicleModelOptions() {
  const env = rentalBatchAddForm.env.trim();
  const tenantId = rentalBatchAddForm.tenant_id.trim();
  const customId = rentalBatchAddForm.custom_id.trim();
  if (!env || !tenantId || !customId) {
    rentalBatchAddVehicleModelOptions.value = [];
    rentalBatchAddForm.vehicle_model_id = "";
    return;
  }
  rentalBatchAddVehicleModelLoading.value = true;
  try {
    const res: any = await rentalBusinessVehicleModelAllAPI({
      env,
      tenant_id: tenantId,
      custom_id: customId,
    });
    if (res != null && Number(res.code) !== 0) {
      rentalBatchAddVehicleModelOptions.value = [];
      rentalBatchAddForm.vehicle_model_id = "";
      message.error(res?.msg || "获取车型失败");
      return;
    }
    const rows = Array.isArray(res?.data) ? res.data : [];
    const options = rows
      .map((item: any) => {
        if (!item || typeof item !== "object") return null;
        const obj = item as Record<string, unknown>;
        const { id, name } = extractIdAndName(
          obj,
          ["id", "modelId", "model_id", "vehicleModelId", "vehicle_model_id"],
          ["name", "modelName", "model_name", "vehicleModelName", "vehicle_model_name"],
        );
        if (!id) return null;
        return { label: `${name}(${id})`, value: id };
      })
      .filter((item: any) => item != null);
    rentalBatchAddVehicleModelOptions.value = options;
    if (!options.some((item: any) => item.value === rentalBatchAddForm.vehicle_model_id)) {
      rentalBatchAddForm.vehicle_model_id = "";
    }
  } catch (error: any) {
    rentalBatchAddVehicleModelOptions.value = [];
    rentalBatchAddForm.vehicle_model_id = "";
    message.error(error?.message || String(error) || "获取车型失败");
  } finally {
    rentalBatchAddVehicleModelLoading.value = false;
  }
}

// 只要结果表存在数据（无论成功/失败），都视为处于“开始模拟”状态，需先停止后才能再次创建
const batchMockSessionActive = computed(() => {
  if (batchMockListRows.value.length > 0) return true;
  // 无明细列表时，有 batch_group 也视为有活跃批次（可停止）
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  return !!session?.batch_group;
});
const hasBatchGroup = computed(() => {
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  return !!session?.batch_group;
});
const stopCount = computed(() => {
  if (checkedRowKeys.value.length > 0) return checkedRowKeys.value.length;
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  return session?.batchCount ?? 0;
});
const totalDeviceCount = computed(() =>
  batchSessions.value.reduce((sum, s) => sum + (s.batchCount ?? s.rows.length), 0)
);
const sharedBindDisabledByEnv = computed(() => formData.business_type !== 1);
const rentalBatchAddDisabledByEnv = computed(() => formData.business_type !== 2);

function batchMockRowKey(row: BatchMockListRow) {
  return row.row_key;
}

interface RowEditDraft {
  lng: number | null;
  lat: number | null;
  voltage: number | null;
}
const rowEditDraftMap = ref<Record<string, RowEditDraft>>({});
const rowUpdateLoadingMap = ref<Record<string, boolean>>({});

function getRowEditDraft(row: BatchMockListRow): RowEditDraft | null {
  return rowEditDraftMap.value[row.row_key] ?? null;
}

function setRowEditDraftValue(
  rowKey: string,
  key: keyof RowEditDraft,
  val: number | null,
) {
  const draft = rowEditDraftMap.value[rowKey];
  if (!draft) return;
  rowEditDraftMap.value = {
    ...rowEditDraftMap.value,
    [rowKey]: {
      ...draft,
      [key]: typeof val === "number" && Number.isFinite(val) ? val : null,
    },
  };
}

function startEditRow(row: BatchMockListRow) {
  if (!row.is_mock_success) {
    message.warning("仅模拟成功的数据支持编辑");
    return;
  }
  if (!row.connect_id) {
    message.error("该行缺少 connect_id，无法编辑");
    return;
  }
  rowEditDraftMap.value = {
    ...rowEditDraftMap.value,
    [row.row_key]: {
      lng: row.lng,
      lat: row.lat,
      voltage: row.voltage,
    },
  };
}

function cancelEditRow(rowKey: string) {
  const next = { ...rowEditDraftMap.value };
  delete next[rowKey];
  rowEditDraftMap.value = next;
}

async function saveEditRow(row: BatchMockListRow) {
  const draft = getRowEditDraft(row);
  if (!draft) return;
  if (!row.connect_id) {
    message.error("connect_id 为空，无法保存");
    return;
  }
  rowUpdateLoadingMap.value = { ...rowUpdateLoadingMap.value, [row.row_key]: true };
  try {
    const payload: Record<string, unknown> = {
      connect_id: row.connect_id,
      bin68_immediately: true,
    };
    if (draft.lng != null) payload.lng = draft.lng;
    if (draft.lat != null) payload.lat = draft.lat;
    if (draft.voltage != null) payload.voltage = draft.voltage;
    const res: any = await xiaoanEcuMockUpdateAPI(payload);
    if (res != null && Number(res.code) !== 0) {
      message.error(res?.msg || "保存失败");
      return;
    }
    row.lng = draft.lng;
    row.lat = draft.lat;
    row.voltage = draft.voltage;
    cancelEditRow(row.row_key);
    message.success("保存成功");
  } catch (error: any) {
    message.error(error?.message || String(error) || "保存失败");
  } finally {
    const next = { ...rowUpdateLoadingMap.value };
    delete next[row.row_key];
    rowUpdateLoadingMap.value = next;
  }
}

const batchMockTableColumns = computed<DataTableColumns<BatchMockListRow>>(() => {
  const cols: DataTableColumns<BatchMockListRow> = [
    { type: "selection", width: 42 },
    {
      title: "IMEI",
      key: "imei",
      width: 140,
      ellipsis: { tooltip: true },
    },
    {
      title: "创建时间",
      key: "create_datetime",
      width: 170,
      ellipsis: { tooltip: true },
      render(row) {
        return row.create_datetime || "—";
      },
    },
    {
      title: "模拟成功？",
      key: "is_mock_success",
      width: 72,
      render(row) {
        const tagNode = h(
          NTag,
          { type: row.is_mock_success ? "success" : "error", size: "small", bordered: false },
          { default: () => (row.is_mock_success ? "是" : "否") },
        );
        if (row.is_mock_success || !row.error) return tagNode;
        return h(
          NTooltip,
          { trigger: "hover" },
          {
            trigger: () => tagNode,
            default: () => row.error,
          },
        );
      },
    },
    {
      title: "经度",
      key: "lng",
      width: 108,
      render(row) {
        const draft = getRowEditDraft(row);
        if (draft) {
          return h(NInputNumber, {
            value: draft.lng,
            "onUpdate:value": (val: number | null) => setRowEditDraftValue(row.row_key, "lng", val),
            size: "small",
            showButton: false,
            style: "width: 96px",
          });
        }
        return row.lng != null ? String(row.lng) : "—";
      },
    },
    {
      title: "纬度",
      key: "lat",
      width: 108,
      render(row) {
        const draft = getRowEditDraft(row);
        if (draft) {
          return h(NInputNumber, {
            value: draft.lat,
            "onUpdate:value": (val: number | null) => setRowEditDraftValue(row.row_key, "lat", val),
            size: "small",
            showButton: false,
            style: "width: 96px",
          });
        }
        return row.lat != null ? String(row.lat) : "—";
      },
    },
    {
      title: "电压(V)",
      key: "voltage",
      width: 88,
      render(row) {
        const draft = getRowEditDraft(row);
        if (draft) {
          return h(NInputNumber, {
            value: draft.voltage,
            "onUpdate:value": (val: number | null) => setRowEditDraftValue(row.row_key, "voltage", val),
            min: 0,
            max: 72,
            size: "small",
            showButton: false,
            style: "width: 76px",
          });
        }
        return row.voltage != null ? String(row.voltage) : "—";
      },
    },
  ];
  if (showSharedBindCol.value) {
    cols.push({
      title: "绑定成功（共享）",
      key: "bind_success",
      width: 112,
      render(row) {
        if (row.biz_scene !== "shared_bind_online") return "—";
        if (row.bind_success == null) return "—";
        return h(
          NTag,
          { type: row.bind_success ? "success" : "error", size: "small", bordered: false },
          { default: () => (row.bind_success ? "是" : "否") },
        );
      },
    });
  }
  if (showRentalBatchAddCol.value) {
    cols.push({
      title: "入库成功（短租）",
      key: "rental_add_success",
      width: 112,
      render(row) {
        if (row.biz_scene !== "rental_batch_add") return "—";
        if (row.rental_add_success == null) return "—";
        const tagNode = h(
          NTag,
          { type: row.rental_add_success ? "success" : "error", size: "small", bordered: false },
          { default: () => (row.rental_add_success ? "是" : "否") },
        );
        if (row.rental_add_success) return tagNode;
        return h(
          NTooltip,
          { trigger: "hover" },
          {
            trigger: () => tagNode,
            default: () => row.error || "未知错误",
          },
        );
      },
    });
  }
  cols.push({
    title: "操作",
    key: "actions",
    width: 170,
    fixed: "right",
    render(row) {
      const draft = getRowEditDraft(row);
      const loading = !!rowUpdateLoadingMap.value[row.row_key];
      if (draft) {
        return h("div", { class: "row-action-wrap" }, [
          h(
            NButton,
            {
              size: "tiny",
              type: "primary",
              loading,
              onClick: () => void saveEditRow(row),
            },
            { default: () => "保存" },
          ),
          h(
            NButton,
            {
              size: "tiny",
              disabled: loading,
              onClick: () => cancelEditRow(row.row_key),
            },
            { default: () => "取消" },
          ),
        ]);
      }
      return h(
        NButton,
        {
          size: "tiny",
          disabled: !row.connect_id || !row.is_mock_success,
          onClick: () => startEditRow(row),
        },
        { default: () => "编辑" },
      );
    },
  });
  return cols;
});

function handleSelectAllRows() {
  checkedRowKeys.value = filteredBatchMockListRows.value.map((row) => row.row_key);
}

function handleInvertSelectedRows() {
  const selected = new Set(checkedRowKeys.value.map((k) => String(k)));
  checkedRowKeys.value = filteredBatchMockListRows.value
    .map((row) => row.row_key)
    .filter((key) => !selected.has(String(key)));
}

const envPickerShow = ref(false);
const envPickerSource = ref<EnvSource | null>(null);
const envPickerOptions = ref<EnvOption[]>([]);
const envPickerLoading = ref(false);
const envPickerSearch = ref("");
const envPickerPage = ref(1);
/** 每页条数固定，列表区不滚动，靠搜索 + 分页浏览 */
const ENV_PICKER_PAGE_SIZE = 5;
let envPickerRequestId = 0;
const batchRecordLoading = ref(false);
const batchGroupsLoading = ref(false);
let batchRecordLoaded = false;

const envPickerTitle = computed(() => {
  const s = envPickerSource.value;
  if (s === "ebike") return `选择环境 — ${ENV_GROUP_LABEL.ebike}`;
  if (s === "rental") return `选择环境 — ${ENV_GROUP_LABEL.rental}`;
  if (s === "oversea") return `选择环境 — ${ENV_GROUP_LABEL.oversea}`;
  return "选择环境";
});

const envPickerFiltered = computed(() => {
  const q = envPickerSearch.value.trim().toLowerCase();
  const list = envPickerOptions.value;
  if (!q) return list;
  return list.filter((item) => {
    const name = envPickerItemName(item).toLowerCase();
    const val = item.value.toLowerCase();
    const gw = envPickerItemGateway(item).toLowerCase();
    return name.includes(q) || val.includes(q) || gw.includes(q);
  });
});

const envPickerFilteredTotal = computed(() => envPickerFiltered.value.length);

const envPickerNoMatch = computed(
  () =>
    envPickerOptions.value.length > 0 &&
    envPickerSearch.value.trim() !== "" &&
    envPickerFiltered.value.length === 0,
);

const envPickerPageItems = computed(() => {
  const all = envPickerFiltered.value;
  const start = (envPickerPage.value - 1) * ENV_PICKER_PAGE_SIZE;
  return all.slice(start, start + ENV_PICKER_PAGE_SIZE);
});

watch(envPickerSearch, () => {
  envPickerPage.value = 1;
});

watch(envPickerFilteredTotal, (n) => {
  const maxPage = Math.max(1, Math.ceil(n / ENV_PICKER_PAGE_SIZE));
  if (envPickerPage.value > maxPage) envPickerPage.value = maxPage;
});

const parsedImeis = computed(() => parseImeisText(formData.imeis_text));
const validImeis = computed(() => parsedImeis.value.filter((item) => isFifteenDigitImei(item)));
const expectedCoordinateCount = computed(() => getCreatedCount());
const parsedCoordinates = computed(() => {
  try {
    const points = parseCoordinatesText(formData.coordinates_text);
    return {
      count: points.length,
      error: "",
    };
  } catch (error: unknown) {
    return {
      count: 0,
      error: error instanceof Error ? error.message : "经纬度列表格式错误",
    };
  }
});
const modeTipText = computed(() => {
  if (formData.mode === 1) {
    return "随机模式：只需要填写数量，后端会自动生成对应数量的随机 15 位 IMEI。";
  }
  if (formData.mode === 2) {
    return "顺序模式：填写起始 IMEI 和数量，后端会按起始值依次递增生成 IMEI。";
  }
  return "指定模式：手动输入 IMEI 列表，支持换行、空格、逗号分隔，后端按输入内容创建。";
});
const createModeTipText = computed(() => {
  if (formData.create_mode === 2) {
    return `串行创建：每隔 ${formData.serial_interval_ms}ms 启动一个中控模拟，按顺序逐个创建。停止也是`;
  }
  return "并行创建：尽可能并发创建中控模拟，整体创建速度更快。";
});

function saveFormToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...formData }));
}

function applyParsedScatterCoords(lng: number, lat: number) {
  formData.lng = lng;
  formData.lat = lat;
}

function onCoordCombinedTextUpdate(value: string) {
  formData.coord_combined_text = value;
  const parsed = parseCombinedCoordText(value);
  if (parsed) {
    applyParsedScatterCoords(parsed.lng, parsed.lat);
  }
  saveFormToStorage();
}

function onReplyDelaySecUpdate(value: number | null) {
  if (value == null || !Number.isFinite(Number(value))) {
    formData.reply_delay_sec = 0;
  } else {
    formData.reply_delay_sec = Math.min(REPLY_DELAY_MAX_SEC, Math.max(0, Math.trunc(Number(value))));
  }
  saveFormToStorage();
}

function onImmediateStartRidingUpdate(value: boolean) {
  formData.immediate_start_riding = value;
  if (value && (formData.random_move_m == null || formData.random_move_m === 0)) {
    formData.random_move_m = 30;
  }
  saveFormToStorage();
}

function onEnableScheduledReportUpdate(value: boolean) {
  if (value) {
    formData.enable_scheduled_report = true;
    saveFormToStorage();
    return;
  }
  if (formData.immediate_start_riding) {
    message.warning("立即开始骑行开启时，周期上报不可关闭");
    return;
  }
  dialog.warning({
    title: "关闭周期上报",
    content: "关闭后将不再周期性上报心跳与 GPS，创建时仍会完成一次初始化上报。确认关闭？",
    positiveText: "确认关闭",
    negativeText: "取消",
    onPositiveClick: () => {
      formData.enable_scheduled_report = false;
      saveFormToStorage();
    },
  });
}

watch(
  () => formData.num,
  () => {
    if (formData.mode !== 1 && formData.mode !== 2) return;
    numInputStr.value =
      formData.num != null && Number.isFinite(Number(formData.num))
        ? String(Math.trunc(Number(formData.num)))
        : "";
  },
);

watch(
  () => formData.mode,
  () => {
    if (formData.mode !== 1 && formData.mode !== 2) return;
    numInputStr.value =
      formData.num != null && Number.isFinite(Number(formData.num))
        ? String(Math.trunc(Number(formData.num)))
        : "";
  },
);

watch(
  () => formData.env,
  (env) => {
    if (!String(env ?? "").trim()) currentCreateEnvSource.value = null;
  },
);

watch(
  () => formData.create_mode,
  (mode) => {
    if (mode !== 1 && mode !== 2) {
      formData.create_mode = 1;
    }
    if (formData.serial_interval_ms == null || !Number.isFinite(Number(formData.serial_interval_ms))) {
      formData.serial_interval_ms = 10;
    }
    formData.serial_interval_ms = Math.max(0, Math.trunc(Number(formData.serial_interval_ms)));
    saveFormToStorage();
  },
);

watch(
  () => formData.serial_interval_ms,
  (value) => {
    if (value == null || !Number.isFinite(Number(value))) {
      formData.serial_interval_ms = 10;
    } else {
      formData.serial_interval_ms = Math.max(0, Math.trunc(Number(value)));
    }
    saveFormToStorage();
  },
);

watch(
  () => formData.coord_mode,
  (mode) => {
    if (mode === "fixed") {
      formData.radius_m = 0;
      saveFormToStorage();
    }
  },
);

// 表单变化实时同步到当前 tab 的快照
watch(
  () => ({ ...formData }),
  (snap) => {
    const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
    if (session) {
      Object.assign(session.formDataSnapshot, snap);
      session.env = snap.env || "";
      session.business_type = snap.business_type;
      session.batchCount = snap.mode === 3 ? validImeis.value.length : Number(snap.num) || 0;
      saveSessionsToStorage();
    }
  },
  { deep: true },
);

function onNumInputWheel() {
  // 避免 number 输入框聚焦时滚轮改变值
}

/** 顺序模式：86 + 8 位随机数字 + 00001，共 15 位 */
function fillRandomStartImei() {
  const n = Math.floor(Math.random() * 1e8);
  const mid = String(n).padStart(8, "0");
  formData.start_imei = `86${mid}00001`;
  saveFormToStorage();
}

function onNumInputStrUpdate(value: string | null) {
  const raw = String(value ?? "");
  const digits = raw.replace(/\D/g, "");
  numInputStr.value = digits;
  if (!digits) {
    formData.num = null;
    saveFormToStorage();
    return;
  }
  const n = Math.trunc(Number(digits));
  if (!Number.isFinite(n)) {
    formData.num = null;
    saveFormToStorage();
    return;
  }
  const clamped = Math.max(1, n);
  formData.num = clamped;
  numInputStr.value = String(clamped);
  saveFormToStorage();
}

async function handleImeiLngLatCsvBeforeUpload(data: { file: { file?: File | null } }) {
  const rawFile = data?.file?.file;
  if (!(rawFile instanceof File)) {
    message.error("读取 CSV 文件失败");
    return false;
  }
  try {
    const text = await rawFile.text();
    const rows = parseImeiLngLatCsv(text);
    formData.mode = 3;
    formData.coord_mode = "fixed";
    formData.radius_m = 0;
    formData.imeis_text = rows.map((row) => row.imei).join("\n");
    formData.coordinates_text = rows.map((row) => `${row.lng},${row.lat}`).join("\n");
    saveFormToStorage();
    message.success(`CSV 导入成功：共 ${rows.length} 条`);
  } catch (error: any) {
    message.error(error?.message || "CSV 解析失败");
  }
  return false;
}

function normalizeVoltagePair(a: number | null, b: number | null): [number, number] {
  const clamp = (n: number) => Math.min(VOLTAGE_MAX, Math.max(VOLTAGE_MIN, n));
  const x = clamp(Math.trunc(Number(a ?? 0)));
  const y = clamp(Math.trunc(Number(b ?? 0)));
  return [Math.min(x, y), Math.max(x, y)];
}

function syncVoltageSliderFromForm() {
  voltageSlider.value = normalizeVoltagePair(formData.voltage_min, formData.voltage_max);
}

function onVoltageSliderUpdate(val: [number, number]) {
  const [min, max] = normalizeVoltagePair(val?.[0] ?? 0, val?.[1] ?? 0);
  voltageSlider.value = [min, max];
  formData.voltage_min = min;
  formData.voltage_max = max;
  saveFormToStorage();
}

function onVoltageNumberUpdate() {
  const [min, max] = normalizeVoltagePair(formData.voltage_min, formData.voltage_max);
  formData.voltage_min = min;
  formData.voltage_max = max;
  voltageSlider.value = [min, max];
  saveFormToStorage();
}

function normalizeEnvOptions(
  data: Record<string, unknown>,
  source: EnvSource,
): {
  options: EnvOption[];
  envMap: Record<string, EnvRecord>;
} {
  const envMap: Record<string, EnvRecord> = {};
  const options = Object.entries(data)
    .map(([key, value]) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) return null;
      const record = value as EnvRecord;
      const order = Number(record.order);
      if (!Number.isFinite(order)) return null;
      const gateway = pickGatewayBySource(source, record);
      if (!gateway) return null;
      envMap[key] = record;
      const name = typeof record.name === "string" && record.name.trim() ? record.name : key;
      return {
        label: `${name} (${gateway})`,
        value: key,
        order,
        record,
      };
    })
    .filter((item): item is EnvOption => item != null)
    .sort((a, b) => a.order - b.order);

  return { options, envMap };
}

function pickGatewayBySource(source: EnvSource, record: EnvRecord): string {
  if (source === "rental") {
    const value = record["3"];
    return typeof value === "string" ? value : "";
  }
  const value = record.ebike_target_addr;
  return typeof value === "string" ? value : "";
}

async function fetchEnvListRaw(source: EnvSource): Promise<any> {
  if (source === "ebike") return getEbikeEnvListAPI();
  if (source === "rental") return getRentalEnvListAPI();
  return getOverseaEnvListAPI();
}

async function fetchEnvListForSource(
  source: EnvSource,
): Promise<{ options: EnvOption[]; envMap: Record<string, EnvRecord>; error?: string }> {
  try {
    const res: any = await fetchEnvListRaw(source);
    if (res != null && Number(res.code) !== 0) {
      return { options: [], envMap: {}, error: res?.msg || "获取环境列表失败" };
    }
    const data = res?.data && typeof res.data === "object" ? res.data : {};
    return normalizeEnvOptions(data as Record<string, unknown>, source);
  } catch (error: any) {
    return { options: [], envMap: {}, error: error?.message || String(error) || "获取环境列表失败" };
  }
}

async function openEnvPickerModal(source: EnvSource) {
  envPickerSource.value = source;
  envPickerShow.value = true;
  envPickerSearch.value = "";
  envPickerPage.value = 1;
  envPickerOptions.value = [];
  const reqId = ++envPickerRequestId;
  envPickerLoading.value = true;
  requestError.value = "";
  try {
    const { options, error } = await fetchEnvListForSource(source);
    if (reqId !== envPickerRequestId) return;
    if (error) {
      requestError.value = error;
      message.error(error);
      return;
    }
    envPickerOptions.value = options;
    // if (options.length === 0) {
    //   message.warning("没有环境");
    // }
  } finally {
    if (reqId === envPickerRequestId) envPickerLoading.value = false;
  }
}

function envPickerItemName(item: EnvOption): string {
  const n = item.record.name;
  return typeof n === "string" && n.trim() ? n.trim() : item.value;
}

function envPickerItemGateway(item: EnvOption): string {
  const src = envPickerSource.value;
  if (!src) return "—";
  const g = pickGatewayBySource(src, item.record);
  return g || "—";
}

function applyEnvFromPicker(item: EnvOption) {
  const src = envPickerSource.value;
  if (!src) return;
  applyEnvSelection(src, item.value, item.record);
  envPickerShow.value = false;
}

function onEnvPickerAfterLeave() {
  envPickerSource.value = null;
  envPickerOptions.value = [];
  envPickerSearch.value = "";
  envPickerPage.value = 1;
}

function applyEnvSelection(source: EnvSource, envKey: string, record: EnvRecord) {
  currentCreateEnvSource.value = source;
  formData.business_type = BUSINESS_TYPE_BY_SOURCE[source];
  formData.env = envKey;
  if (!envKey) return;
  const gateway = pickGatewayBySource(source, record);
  if (gateway) {
    formData.server = gateway;
  }
  saveFormToStorage();
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  if (session) {
    session.business_type = BUSINESS_TYPE_BY_SOURCE[source];
    session.env = envKey;
    session.formDataSnapshot = { ...formData };
    saveSessionsToStorage();
  }
}

function resetDefaultCoords() {
  if (formData.coord_mode === "fixed") {
    formData.coordinates_text = "";
    saveFormToStorage();
    return;
  }
  formData.lng = DEFAULT_COORD_LNG;
  formData.lat = DEFAULT_COORD_LAT;
  formData.coord_combined_text = formatCombinedCoordText(DEFAULT_COORD_LNG, DEFAULT_COORD_LAT);
  saveFormToStorage();
}

function handleReset() {
  saveCurrentSessionToActive();
  Object.assign(formData, { ...defaultFormData });
  numInputStr.value =
    formData.num != null && Number.isFinite(Number(formData.num))
      ? String(Math.trunc(Number(formData.num)))
      : "";
  syncVoltageSliderFromForm();
  envPickerShow.value = false;
  envPickerSource.value = null;
  envPickerOptions.value = [];
  batchMockListRows.value = [];
  checkedRowKeys.value = [];
  requestError.value = "";
  successSummary.value = "";
  showSharedBindCol.value = false;
  showRentalBatchAddCol.value = false;
  currentCreateEnvSource.value = null;
  nextSequentialStartImei.value = "";
  saveFormToStorage();
  const newId = generateSessionId();
  const newSession: BatchSessionMeta = {
    id: newId,
    batch_group: "",
    createDatetime: new Date().toISOString().replace("T", " ").slice(0, 19),
    env: "",
    business_type: null,
    rows: [],
    batchCount: 0,
    formDataSnapshot: { ...formData },
    successSummary: "",
    requestError: "",
    showSharedBindCol: false,
    showRentalBatchAddCol: false,
    showDetailTable: true,
      checkedRowKeys: [],
    currentCreateEnvSource: null,
    numInputStr: "",
    voltageSlider: [0, 0],
  };
  batchSessions.value.push(newSession);
  activeSessionId.value = newId;
  saveSessionsToStorage();
}

function getCreatedCount(): number {
  if (formData.mode === 3) return validImeis.value.length;
  return Number(formData.num) || 0;
}

/** get_batch_record 回显到表单（按 batch_add 的 data 结构） */
function applyBatchRecordDataToForm(res: unknown) {
  const data = (res as { data?: unknown } | null)?.data;
  if (!data || typeof data !== "object") return;
  if (Array.isArray(data)) {
    const first = (data[0] ?? null) as Record<string, unknown> | null;
    const server =
      first && typeof first.server === "string" ? first.server.trim() : "";
    if (server) formData.server = server;
    const env = first && typeof first.env === "string" ? first.env.trim() : "";
    if (env) formData.env = env;
    const businessType = Number(first?.business_type);
    if (businessType === 1 || businessType === 2 || businessType === 3) {
      formData.business_type = businessType;
    } else if (currentCreateEnvSource.value) {
      formData.business_type = BUSINESS_TYPE_BY_SOURCE[currentCreateEnvSource.value];
    }
    return;
  }
  const record = data as Record<string, unknown>;

  const env = typeof record.env === "string" ? record.env.trim() : "";
  if (env) {
    formData.env = env;
  }
  const businessType = Number(record.business_type);
  if (businessType === 1 || businessType === 2 || businessType === 3) {
    formData.business_type = businessType;
  } else if (currentCreateEnvSource.value) {
    formData.business_type = BUSINESS_TYPE_BY_SOURCE[currentCreateEnvSource.value];
  }

  const modeNum = Number(record.mode);
  if (modeNum === 1 || modeNum === 2 || modeNum === 3) {
    formData.mode = modeNum;
  }

  const server = typeof record.server === "string" ? record.server.trim() : "";
  if (server) formData.server = server;

  const num = Number(record.num);
  if (Number.isInteger(num) && num > 0) {
    const clamped = Math.max(1, Math.trunc(num));
    formData.num = clamped;
    numInputStr.value = String(clamped);
  } else {
    formData.num = null;
    numInputStr.value = "";
  }

  const imeis = Array.isArray(record.imeis)
    ? record.imeis.map((v) => String(v ?? "").trim()).filter((v) => /^\d{15}$/.test(v))
    : [];

  const startImeiRaw =
    typeof record.start_imei === "string"
      ? record.start_imei.trim()
      : typeof record.imei === "string"
        ? record.imei.trim()
        : "";

  if (formData.mode === 2) {
    formData.start_imei = /^\d{15}$/.test(startImeiRaw) ? startImeiRaw : imeis[0] || "";
    formData.imeis_text = "";
  } else if (formData.mode === 3) {
    formData.imeis_text = imeis.join("\n");
    formData.start_imei = "";
  } else {
    formData.start_imei = "";
    formData.imeis_text = "";
  }

  const list = Array.isArray(record.list) ? (record.list as Array<Record<string, unknown>>) : [];

  const recVmin = Number(record.voltage_min);
  const recVmax = Number(record.voltage_max);
  if (Number.isFinite(recVmin) && Number.isFinite(recVmax)) {
    const [vmin, vmax] = normalizeVoltagePair(recVmin, recVmax);
    formData.voltage_min = vmin;
    formData.voltage_max = vmax;
  } else {
    const voltages = list.map((item) => Number(item?.voltage)).filter((v) => Number.isFinite(v));
    if (voltages.length > 0) {
      const [vmin, vmax] = normalizeVoltagePair(Math.min(...voltages), Math.max(...voltages));
      formData.voltage_min = vmin;
      formData.voltage_max = vmax;
    }
  }
  syncVoltageSliderFromForm();

  const radius = Number(record.radius_m);
  const recCoordMode = typeof record.coord_mode === "string" ? record.coord_mode.trim() : "";
  if (recCoordMode === "scatter" || recCoordMode === "fixed") {
    formData.coord_mode = recCoordMode;
  } else {
    formData.coord_mode = Number.isFinite(radius) && radius > 0 ? "scatter" : "fixed";
  }
  if (Number.isFinite(radius) && radius >= 0) {
    formData.radius_m = radius;
  }

  const randomMoveM = Number(record.random_move_m);
  if (Number.isFinite(randomMoveM) && randomMoveM >= 0) {
    formData.random_move_m = randomMoveM;
  }

  const recLng = Number(record.lng);
  const recLat = Number(record.lat);
  if (Number.isFinite(recLng) && Number.isFinite(recLat)) {
    formData.lng = recLng;
    formData.lat = recLat;
    formData.coord_combined_text = formatCombinedCoordText(recLng, recLat);
  }

  const replyDelaySec = Number(record.reply_delay_sec);
  if (Number.isFinite(replyDelaySec) && replyDelaySec >= 0) {
    formData.reply_delay_sec = Math.min(REPLY_DELAY_MAX_SEC, Math.max(0, Math.trunc(replyDelaySec)));
  }

  if (typeof record.enable_scheduled_report === "boolean") {
    formData.enable_scheduled_report = record.enable_scheduled_report;
  }

  if (typeof record.immediate_start_riding === "boolean") {
    formData.immediate_start_riding = record.immediate_start_riding;
  }

  const recordCoordinates = Array.isArray(record.coordinates) ? record.coordinates : [];
  if (recordCoordinates.length > 0) {
    formData.coordinates_text = recordCoordinates
      .map((item) => {
        const lat = Number((item as Record<string, unknown>)?.lat);
        const lng = Number((item as Record<string, unknown>)?.lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
        return `${lng},${lat}`;
      })
      .filter(Boolean)
      .join("\n");
    return;
  }

  const firstPos = list.find((item) => Number.isFinite(Number(item?.lng)) && Number.isFinite(Number(item?.lat)));
  if (firstPos) {
    formData.lng = Number(firstPos.lng);
    formData.lat = Number(firstPos.lat);
    formData.coord_combined_text = formatCombinedCoordText(formData.lng, formData.lat);
  }
  if (formData.coord_mode === "fixed") {
    const fallbackPoint =
      Number.isFinite(Number(formData.lat)) && Number.isFinite(Number(formData.lng))
        ? [{ lat: Number(formData.lat), lng: Number(formData.lng) }]
        : [];
    formData.coordinates_text = fallbackPoint.length > 0 ? `${fallbackPoint[0].lng},${fallbackPoint[0].lat}` : "";
  } else {
    formData.coordinates_text = "";
  }
}

async function handleCopyCheckedImeis() {
  const imeis = Array.from(new Set(checkedImeis.value));
  if (imeis.length === 0) {
    message.warning("请先勾选要复制的 IMEI");
    return;
  }
  const text = imeis.join("\n");
  try {
    await navigator.clipboard.writeText(text);
    message.success(`已复制 ${imeis.length} 条 IMEI`);
    return;
  } catch {
    // fallback below
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) throw new Error("copy failed");
    message.success(`已复制 ${imeis.length} 条 IMEI`);
  } catch {
    message.error("复制失败，请手动复制");
  }
}

function openBindAndOnlineModal() {
  const imeis = resolvedBatchImeis.value;
  bindAndOnlineForm.env = formData.env?.trim() || defaultFormData.env;
  bindAndOnlineForm.tenant_id = formData.tenant_id || "";
  bindAndOnlineForm.service_area_id = "";
  bindAndOnlineForm.imeis_text = imeis.join("\n");
  void loadBindAndOnlineEnvOptions();
  void loadBindAndOnlineServiceAreaOptions();
  bindAndOnlineShow.value = true;
}

function openRentalBatchAddModal() {
  const imeis = resolvedBatchImeis.value;
  rentalBatchAddForm.env = formData.env?.trim() || defaultFormData.env;
  rentalBatchAddForm.tenant_id = formData.tenant_id?.trim() || "";
  rentalBatchAddForm.tenant_name = "";
  rentalBatchAddForm.custom_id = "";
  rentalBatchAddForm.shop_id = "";
  rentalBatchAddForm.vehicle_model_id = "";
  rentalBatchAddForm.imeis_text = imeis.join("\n");
  rentalBatchAddShow.value = true;
  void loadRentalBatchAddEnvOptions();
  void loadRentalBatchAddTenantOptions();
}

async function handleRentalBatchAddSubmit() {
  const env = rentalBatchAddForm.env.trim() || formData.env?.trim() || defaultFormData.env;
  rentalBatchAddForm.env = env;
  const tenantId = rentalBatchAddForm.tenant_id.trim();
  const customId = rentalBatchAddForm.custom_id.trim();
  const shopId = rentalBatchAddForm.shop_id.trim();
  const vehicleModelId = rentalBatchAddForm.vehicle_model_id.trim();
  if (!env) {
    message.error("环境不能为空");
    return;
  }
  if (!tenantId) {
    message.error("租户不能为空");
    return;
  }
  if (!customId) {
    message.error("加盟商不能为空");
    return;
  }
  if (!shopId) {
    message.error("门店不能为空");
    return;
  }
  if (!vehicleModelId) {
    message.error("车型不能为空");
    return;
  }
  const imeis = rentalBatchAddImeis.value;
  if (imeis.length === 0) {
    message.error("请填写至少 1 个有效 IMEI（15 位数字）");
    return;
  }
  rentalBatchAddLoading.value = true;
  try {
    const res: any = await rentalBusinessBatchAddEbikeAPI({
      env,
      tenant_id: tenantId,
      tenant_name: rentalBatchAddForm.tenant_name.trim() || undefined,
      custom_id: customId,
      shop_id: shopId,
      vehicle_model_id: vehicleModelId,
      imeis,
    });
    if (res != null && Number(res.code) !== 0) {
      message.error(res?.msg || "短租批量入库失败");
      return;
    }
    const resultRows = Array.isArray(res?.data?.results) ? res.data.results : [];
    if (resultRows.length > 0) {
      const resultByImei = new Map<
        string,
        { rental_add_success: boolean | null; car_id: string; error: string }
      >();
      resultRows.forEach((item: any) => {
        const imei = typeof item?.imei === "string" ? item.imei.trim() : "";
        if (!imei) return;
        const ok = Boolean(item?.success);
        const errMsg = ok ? "" : item?.resp ? JSON.stringify(item.resp) : "短租批量入库失败";
        resultByImei.set(imei, {
          rental_add_success: ok,
          car_id: typeof item?.car_id === "string" ? item.car_id.trim() : "",
          error: errMsg,
        });
      });
      batchMockListRows.value = batchMockListRows.value.map((row) => {
        const info = resultByImei.get(row.imei);
        if (!info) return row;
        return {
          ...row,
          bind_success: null,
          online_success: null,
          rental_add_success: info.rental_add_success,
          biz_scene: "rental_batch_add",
          car_id: info.car_id || row.car_id,
          error: info.error || row.error,
        };
      });
    }
    showSharedBindCol.value = false;
    showRentalBatchAddCol.value = true;
    rentalBatchAddShow.value = false;
    saveCurrentSessionToActive();
    const sc = Number(res?.data?.success_count);
    const fc = Number(res?.data?.fail_count);
    if (Number.isFinite(sc) || Number.isFinite(fc)) {
      const successCount = Number.isFinite(sc) ? sc : 0;
      const failCount = Number.isFinite(fc) ? fc : Math.max(0, imeis.length - successCount);
      const tail = failCount > 0 ? `，失败 ${failCount} 台` : "";
      message.success(`短租批量入库完成：成功 ${successCount} 台${tail}`);
    } else {
      message.success(`短租批量入库成功：${imeis.length} 台`);
    }
  } catch (error: any) {
    message.error(error?.message || String(error) || "短租批量入库失败");
  } finally {
    rentalBatchAddLoading.value = false;
  }
}

async function handleBindAndOnlineSubmit() {
  const env = bindAndOnlineForm.env.trim() || formData.env?.trim() || defaultFormData.env;
  bindAndOnlineForm.env = env;
  const tenantId = bindAndOnlineForm.tenant_id.trim();
  const serviceAreaId = bindAndOnlineForm.service_area_id.trim();
  if (!env) {
    message.error("环境不能为空");
    return;
  }
  if (!tenantId) {
    message.error("租户ID不能为空");
    return;
  }
  if (!serviceAreaId) {
    message.error("服务区ID不能为空");
    return;
  }
  const imeis = bindAndOnlineImeis.value;
  if (imeis.length === 0) {
    message.error("请填写至少 1 个有效 IMEI（15 位数字）");
    return;
  }
  bindAndOnlineLoading.value = true;
  try {
    const res: any = await xiaoanEcuBatchBindAndOnlineAPI({
      env,
      tenant_id: tenantId,
      service_area_id: serviceAreaId,
      imeis,
    });
    if (res != null && Number(res.code) !== 0) {
      const msg = res?.msg || "批量绑定并上架失败";
      message.error(msg);
      return;
    }
    const resultRows = Array.isArray(res?.data?.results) ? res.data.results : [];
    if (resultRows.length > 0) {
      const resultByImei = new Map<
        string,
        { bind_success: boolean | null; online_success: boolean | null; car_id: string }
      >();
      resultRows.forEach((item: any) => {
        const imei = typeof item?.imei === "string" ? item.imei.trim() : "";
        if (!imei) return;
        resultByImei.set(imei, {
          bind_success: typeof item?.bind_success === "boolean" ? item.bind_success : null,
          online_success: typeof item?.online_success === "boolean" ? item.online_success : null,
          car_id: typeof item?.car_id === "string" ? item.car_id.trim() : "",
        });
      });
      batchMockListRows.value = batchMockListRows.value.map((row) => {
        const bindInfo = resultByImei.get(row.imei);
        if (!bindInfo) return row;
        return {
          ...row,
          bind_success: bindInfo.bind_success,
          online_success: bindInfo.online_success,
          rental_add_success: null,
          biz_scene: "shared_bind_online",
          car_id: bindInfo.car_id,
        };
      });
    }
    showSharedBindCol.value = true;
    showRentalBatchAddCol.value = false;
    bindAndOnlineShow.value = false;
    saveCurrentSessionToActive();
    const sc = Number(res?.data?.success_count);
    const fc = Number(res?.data?.fail_count);
    if (Number.isFinite(sc) || Number.isFinite(fc)) {
      const successCount = Number.isFinite(sc) ? sc : 0;
      const failCount = Number.isFinite(fc) ? fc : Math.max(0, imeis.length - successCount);
      const tail = failCount > 0 ? `，失败 ${failCount} 台` : "";
      message.success(`批量绑定并上架完成：成功 ${successCount} 台${tail}`);
    } else {
      message.success(`批量绑定并上架成功：${imeis.length} 台`);
    }
  } catch (error: any) {
    const msg = error?.message || String(error) || "批量绑定并上架失败";
    message.error(msg);
  } finally {
    bindAndOnlineLoading.value = false;
  }
}

watch(
  () => [bindAndOnlineForm.env, bindAndOnlineForm.tenant_id],
  () => {
    if (!bindAndOnlineShow.value) return;
    void loadBindAndOnlineServiceAreaOptions();
  },
);

watch(
  () => rentalBatchAddForm.env,
  () => {
    if (!rentalBatchAddShow.value) return;
    rentalBatchAddForm.tenant_id = "";
    rentalBatchAddForm.tenant_name = "";
    rentalBatchAddForm.custom_id = "";
    rentalBatchAddForm.shop_id = "";
    rentalBatchAddForm.vehicle_model_id = "";
    rentalBatchAddFranchiseeOptions.value = [];
    rentalBatchAddShopOptions.value = [];
    rentalBatchAddVehicleModelOptions.value = [];
    rentalFranchiseeShopMap.value = {};
    void loadRentalBatchAddTenantOptions();
  },
);

watch(
  () => rentalBatchAddForm.tenant_id,
  () => {
    if (!rentalBatchAddShow.value) return;
    const selected = rentalBatchAddTenantOptions.value.find((item) => item.value === rentalBatchAddForm.tenant_id);
    rentalBatchAddForm.tenant_name = selected?.label?.replace(/\([^)]*\)\s*$/, "") || "";
    rentalBatchAddForm.custom_id = "";
    rentalBatchAddForm.shop_id = "";
    rentalBatchAddForm.vehicle_model_id = "";
    rentalBatchAddFranchiseeOptions.value = [];
    rentalBatchAddShopOptions.value = [];
    rentalBatchAddVehicleModelOptions.value = [];
    rentalFranchiseeShopMap.value = {};
    void loadRentalBatchAddFranchiseeOptions();
  },
);

watch(
  () => rentalBatchAddForm.custom_id,
  () => {
    if (!rentalBatchAddShow.value) return;
    rentalBatchAddForm.shop_id = "";
    rentalBatchAddForm.vehicle_model_id = "";
    rentalBatchAddVehicleModelOptions.value = [];
    refreshRentalBatchAddShopOptions();
    void loadRentalBatchAddVehicleModelOptions();
  },
);

async function loadBatchMockRecords() {
  if (batchRecordLoaded) return;
  batchRecordLoaded = true;
  batchRecordLoading.value = true;
  try {
    const res: any = await xiaoanEcuMockBatchRecordAPI({ source: "batch" });
    if (res != null && Number(res.code) !== 0) return;
    applyBatchRecordDataToForm(res);
    const rows = parseBatchMockListFromResponse(res);
    const mergedRows = rows.length > 0 ? rows : parseBatchMockListFromLegacyRecordResponse(res);
    batchMockListRows.value = mergedRows;
    showSharedBindCol.value = false;
    showRentalBatchAddCol.value = false;
    checkedRowKeys.value = mergedRows.map((row) => row.row_key);
    saveFormToStorage();
    // 创建 session
    if (mergedRows.length > 0 && !activeSessionId.value) {
      const newId = generateSessionId();
      const newSession: BatchSessionMeta = {
        id: newId,
        batch_group: "",
        createDatetime: new Date().toISOString().replace("T", " ").slice(0, 19),
        env: formData.env || "",
        business_type: formData.business_type,
        rows: [...mergedRows],
        batchCount: mergedRows.length,
        formDataSnapshot: { ...formData },
        successSummary: successSummary.value,
        requestError: requestError.value,
        showSharedBindCol: false,
        showRentalBatchAddCol: false,
        showDetailTable: true,
        checkedRowKeys: [...checkedRowKeys.value],
        currentCreateEnvSource: currentCreateEnvSource.value,
        numInputStr: numInputStr.value,
        voltageSlider: [...voltageSlider.value],
      };
      batchSessions.value.push(newSession);
      activeSessionId.value = newId;
      saveSessionsToStorage();
    }
  } catch {
    // 历史记录加载失败不阻塞页面主流程
  } finally {
    batchRecordLoading.value = false;
  }
}

onMounted(() => {
  loadSessionsFromStorage();
  // 从后端 API 加载批次分组（兼容 localStorage 被清除的情况）
  if (batchSessions.value.length === 0) {
    void loadBatchGroupsFromApi().then(() => {
      // 如果 API 也没有数据，尝试加载历史记录
      if (batchSessions.value.length === 0) {
        void loadBatchMockRecords();
      }
    });
  }
});

// setup 阶段也触发一次
if (batchSessions.value.length === 0) {
  void loadBatchGroupsFromApi().then(() => {
    if (batchSessions.value.length === 0) {
      void loadBatchMockRecords();
    }
  });
}

async function handleStopMock() {
  const session = batchSessions.value.find((s) => s.id === activeSessionId.value);
  const batchGroup = session?.batch_group?.trim() || "";
  if (batchGroup) {
    // 有 batch_group，按批次 ID 一次停止整批
    stopMockLoading.value = true;
    requestError.value = "";
    successSummary.value = "";
    try {
      const res: any = await xiaoanEcuMockBatchDeleteByGroupAPI({
        batch_group: batchGroup,
      });
      if (res != null && Number(res.code) !== 0) {
        message.error(res?.msg || "批量停止失败");
        requestError.value = res?.msg || "批量停止失败";
        return;
      }
      checkedRowKeys.value = [];
      batchMockListRows.value = [];
      showDetailTable.value = false;
      // 清除 batch_group 使表单可交互、按钮切回「批量创建」
      if (session) {
        session.batch_group = "";
        session.batchCount = 0;
      }
      message.success("批量停止完成");
      saveFormToStorage();
      saveCurrentSessionToActive();
    } catch (e: any) {
      const msg = e?.message || String(e) || "批量停止失败";
      requestError.value = msg;
      message.error(msg);
    } finally {
      stopMockLoading.value = false;
    }
    return;
  }

  // 没有 batch_group，无法停止
  message.warning("该批次没有 batch_group，无法停止");
}

async function handleCreate() {
  const error = validateBatchForm(formData);
  if (error) {
    message.error(error);
    requestError.value = error;
    return;
  }

  createLoading.value = true;
  requestError.value = "";
  successSummary.value = "";
  showSharedBindCol.value = false;
  showRentalBatchAddCol.value = false;
  const startAt = performance.now();

  try {
    const payload = buildBatchPayload(formData);
    payload.business_type = formData.business_type || 1;
    const res: any = await xiaoanEcuMockBatchCreateAPI(payload);
    const resBusinessType = Number(res?.data?.business_type);
    if (resBusinessType === 1 || resBusinessType === 2 || resBusinessType === 3) {
      formData.business_type = resBusinessType;
    }
    const elapsedSec = ((performance.now() - startAt) / 1000).toFixed(2);
    if (res != null && Number(res.code) !== 0) {
      const msg = res?.msg || "批量创建失败";
      requestError.value = msg;
      message.error(msg);
      batchMockListRows.value = [];
      checkedRowKeys.value = [];
      return;
    }

    const list = parseBatchMockListFromResponse(res);
    const resData = res?.data;
    const hasList = list.length > 0;
    if (hasList) {
      batchMockListRows.value = list;
      checkedRowKeys.value = list.map((row) => row.row_key);
    } else {
      // 无明细列表，不保留任何行数据
      batchMockListRows.value = [];
      checkedRowKeys.value = [];
    }
    showDetailTable.value = hasList;
    const resRandomMoveM = Number(resData?.random_move_m);
    if (Number.isFinite(resRandomMoveM) && resRandomMoveM >= 0) {
      formData.random_move_m = resRandomMoveM;
    }
    const resSuccessCount = Number(resData?.success_count) || 0;
    const resFailCount = Number(resData?.fail_count) || 0;
    if (hasList) {
      // 有明细列表，逐条处理
      const successRows = list.filter((row) => row.is_mock_success && !!row.connect_id);
      const failRows = list.filter((row) => !row.is_mock_success);
      checkedRowKeys.value = list.map((row) => row.row_key);
      if (successRows.length > 0) {
        const tail = failRows.length > 0 ? `，失败 ${failRows.length} 台` : "";
        successSummary.value = `批量创建完成：成功 ${successRows.length} 台${tail}（耗时 ${elapsedSec} 秒）`;
        message.success(successSummary.value);
      } else if (failRows.length > 0) {
        const firstError = failRows.find((row) => !!row.error)?.error || "请查看下方失败原因";
        requestError.value = `批量创建失败：共 ${failRows.length} 台失败，原因示例：${firstError}`;
        message.error("批量创建失败，请查看下方失败原因");
      } else {
        checkedRowKeys.value = [];
        const count = getCreatedCount();
        successSummary.value = `批量创建请求成功，已提交 ${count} 台设备（耗时 ${elapsedSec} 秒）`;
        message.success(successSummary.value);
      }
    } else {
      // 无明细列表，直接用计数（checkedRowKeys 已全选，不清空以便停止）
      if (resSuccessCount > 0) {
        const tail = resFailCount > 0 ? `，失败 ${resFailCount} 台` : "";
        successSummary.value = `批量创建完成：成功 ${resSuccessCount} 台${tail}（耗时 ${elapsedSec} 秒）`;
        message.success(successSummary.value);
      } else if (resFailCount > 0) {
        requestError.value = `批量创建失败：共 ${resFailCount} 台失败`;
        message.error("批量创建失败");
      } else {
        const count = getCreatedCount();
        successSummary.value = `批量创建请求成功，已提交 ${count} 台设备（耗时 ${elapsedSec} 秒）`;
        message.success(successSummary.value);
      }
    }
    saveFormToStorage();
    // 保存当前批次到 session
    const resBatchGroup = res?.data?.batch_group ? String(res.data.batch_group) : "";
    if (!activeSessionId.value) {
      const newId = generateSessionId();
      const newSession: BatchSessionMeta = {
        id: newId,
        batch_group: resBatchGroup,
        createDatetime: new Date().toISOString().replace("T", " ").slice(0, 19),
        env: formData.env || "",
        business_type: formData.business_type,
        rows: [...batchMockListRows.value],
        batchCount: resSuccessCount || getCreatedCount(),
        formDataSnapshot: { ...formData },
        successSummary: successSummary.value,
        requestError: requestError.value,
        showSharedBindCol: false,
        showRentalBatchAddCol: false,
        showDetailTable: true,
        checkedRowKeys: [...checkedRowKeys.value],
        currentCreateEnvSource: currentCreateEnvSource.value,
        numInputStr: numInputStr.value,
        voltageSlider: [...voltageSlider.value],
      };
      batchSessions.value.push(newSession);
      activeSessionId.value = newId;
    } else {
      saveCurrentSessionToActive();
      // 更新 batch_group
      const cur = batchSessions.value.find((s) => s.id === activeSessionId.value);
      if (cur && resBatchGroup && !cur.batch_group) {
        cur.batch_group = resBatchGroup;
      }
    }
    saveSessionsToStorage();
    // 顺序模式下自动递进起始 IMEI
    if (formData.mode === 2 && /^\d{15}$/.test(formData.start_imei) && Number(formData.num) > 0) {
      const nextImei = String(Number(formData.start_imei) + Number(formData.num)).padStart(15, "0");
      if (/^\d{15}$/.test(nextImei)) {
        nextSequentialStartImei.value = nextImei;
      }
    } else {
      nextSequentialStartImei.value = "";
    }
  } catch (error: any) {
    const msg = error?.message || String(error) || "批量创建失败";
    requestError.value = msg;
    message.error(msg);
    batchMockListRows.value = [];
    checkedRowKeys.value = [];
  } finally {
    createLoading.value = false;
  }
}
</script>

<style lang="less" scoped>
.xiaoan-ecu-mock-batch {
  width: 100px;
}

.form-section {
  max-width: 100%;
}

.form-actions {
  margin-top: 8px;
}

.form-actions-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
}

.bind-online-right-btn {
  margin-left: auto;
}

.rental-batch-add-right-btn {
  margin-left: 0;
}

.mode-section {
  width: 100%;
}

.mode-tip {
  margin-top: 6px;
  font-size: 11px;
  color: #9ca3af;
}

.reply-delay-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  flex-wrap: wrap;
}

.reply-delay-input {
  width: 88px;
  flex-shrink: 0;
}

.scheduled-report-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.scheduled-report-label {
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.num-field {
  width: 100%;
}

.num-input {
  width: 100%;
}

.num-tip {
  margin-top: 6px;
  font-size: 11px;
  color: #9ca3af;
}

.gateway-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.gateway-main-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.gateway-input {
  flex: 1;
  min-width: 0;
}

.gateway-buttons {
  margin-left: 0;
}

.tenant-label-row {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  font-size: 14px;
  color: #111827;
}

.tenant-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.tenant-input {
  width: 240px;
}

.env-picker-body {
  margin-top: -2px;
}

.env-picker-hint {
  margin: 0 0 14px;
  padding: 8px 12px;
  font-size: 12px;
  line-height: 1.55;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.env-picker-list-panel {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  overflow: hidden;
}

.env-picker-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 8px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
}

.env-picker-search-input {
  flex: 1;
  min-width: 0;
}

.env-picker-count {
  flex-shrink: 0;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
}

.env-picker-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 8px;
  list-style: none;
}

.env-picker-item {
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid #e5e7eb;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.env-picker-item:hover {
  border-color: #7dd3fc;
  background: #f0f9ff;
  box-shadow: 0 2px 8px rgb(14 165 233 / 0.12);
}

.env-picker-item:focus-visible {
  outline: none;
  border-color: #38bdf8;
  box-shadow: 0 0 0 2px rgb(56 189 248 / 0.35);
}

.env-picker-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.env-picker-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.env-picker-key-tag {
  flex-shrink: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.env-picker-addr {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #e5e7eb;
  font-size: 12px;
  line-height: 1.45;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #64748b;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.env-picker-pagination-wrap {
  display: flex;
  justify-content: center;
  padding: 8px 10px 10px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.env-picker-empty-wrap {
  padding: 28px 12px 36px;
}

.env-picker-empty-tip {
  margin: 12px auto 0;
  max-width: 420px;
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  text-align: center;
}

.env-picker-empty-tip code {
  padding: 0 4px;
  font-size: 11px;
  color: #64748b;
  background: #f1f5f9;
  border-radius: 4px;
}

.start-imei-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.start-imei-input {
  flex: 1;
  min-width: 0;
}

.start-imei-random-btn {
  flex-shrink: 0;
}

.voltage-range {
  width: 100%;
  max-width: 420px;
}

.voltage-inputs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.voltage-inputs .n-input-number {
  flex: 1;
  min-width: 0;
}

.voltage-sep {
  color: #9ca3af;
  flex-shrink: 0;
}

.imeis-textarea-wrap {
  width: 100%;
}

.imeis-preview {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.coord-label-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.4;
}

.coord-picker-link {
  font-size: 12px;
}

.csv-actions-row {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  flex-wrap: nowrap;
}

.csv-actions-row>* {
  flex: none;
}

.csv-upload-inline {
  display: inline-flex;
  width: auto;
  max-width: 100%;
}

.result-block {
  margin-top: 16px;
}

.result-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
}

.batch-mock-table-hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}

.batch-mock-result-table {
  max-width: 100%;
}

.table-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.table-actions-left {
  flex-shrink: 0;
}

.table-filters-right {
  margin-left: auto;
}

.table-filter-select {
  width: 120px;
}

.table-imei-search {
  width: 200px;
}

.bind-online-imeis-wrap {
  width: 100%;
}

.bind-online-imeis-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

.batch-mock-result-table :deep(.n-data-table) {
  font-size: 12px;
}

.batch-mock-result-table :deep(.n-data-table-th),
.batch-mock-result-table :deep(.n-data-table-td) {
  padding-top: 4px !important;
  padding-bottom: 4px !important;
}

.batch-mock-result-table :deep(.n-data-table-td) {
  line-height: 1.2;
}

.row-action-wrap {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.tip-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  border: 1px solid #d1d5db;
  font-size: 11px;
  color: #6b7280;
  cursor: help;
}

/* ========== 多批次 Tab 样式 ========== */
.existing-tabs-wrap {
  margin-bottom: 8px;
}

.existing-tabs-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.tabs-loading-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  color: #888;
  font-size: 13px;
}

.tabs-loading-text {
  white-space: nowrap;
}

.tabs-summary {
  display: flex;
  align-items: center;
  padding: 4px 12px 8px;
}

.tabs-summary-text {
  font-size: 12px;
  color: #999;
}

.add-mock-button {
  flex-shrink: 0;
  margin-left: auto;
}

.tabs-loading-spin {
  margin-left: 8px;
}

.mock-tab {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 260px;
  max-width: 100%;
  padding: 4px 6px 4px 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  cursor: pointer;
}

.mock-tab:hover {
  border-color: #d1d5db;
}

.mock-tab-active {
  border-color: #22c55e;
  background: #f0fdf4;
  color: #166534;
}

.mock-tab-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: stretch;
  gap: 1px;
  min-width: 0;
  line-height: 1.25;
  text-align: left;
}

.mock-tab-top {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  white-space: nowrap;
}

.mock-status-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  color: #6b7280;
  background: #f9fafb;
}

.mock-status-env,
.mock-status-tenant {
  color: #6b7280;
  background: #f9fafb;
}

.mock-tab-imei-row {
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 0;
}

.mock-tab-imei {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.mock-tab-imei-range {
  font-size: 11px;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 220px;
}

.mock-tab-time {
  margin-left: auto;
  font-size: 11px;
  font-weight: 400;
  color: #9ca3af;
  white-space: nowrap;
}

.mock-tab-close-btn {
  width: 18px;
  height: 18px;
  min-width: 18px;
  color: #9ca3af;
}

.mock-tab-close-btn:hover {
  color: #d03050;
}
</style>