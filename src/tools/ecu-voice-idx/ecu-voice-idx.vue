<template>
  <div class="ecu-voice-idx">
    <n-card title="快捷设置语音位">
      <n-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-placement="left"
        label-width="120px"
        require-mark-placement="right-hanging"
      >
        <n-grid :cols="2" :x-gap="12" :y-gap="16">
          <n-gi>
            <n-form-item label="IMEI" path="imei" required>
              <n-input
                v-model:value="formData.imei"
                placeholder="15 位数字"
                maxlength="15"
                show-count
                size="small"
                style="width: 100%"
                @input="onImeiInput"
              />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="语音位(idx)" path="idx" required>
              <n-space align="center" :size="8" style="width: 100%">
                <n-input-number
                  v-model:value="formData.idx"
                  :min="0"
                  placeholder="最小值为 0"
                  size="small"
                  class="idx-input"
                />
                <n-tooltip trigger="hover">
                  <template #trigger>
                    <n-button
                      type="primary"
                      size="small"
                      :loading="playLoading"
                      :disabled="!canPlay"
                      @click="handlePlay"
                    >
                      <template #icon>
                        <n-icon :component="PlayerPlay" :size="18" />
                      </template>
                    </n-button>
                  </template>
                  播放该语音位
                </n-tooltip>
              </n-space>
            </n-form-item>
          </n-gi>
          <n-gi :span="2">
            <n-form-item label="语音文本" path="text" required>
              <n-input
                v-model:value="formData.text"
                type="textarea"
                placeholder="最少 4 个字符"
                :rows="3"
                size="small"
                style="width: 100%"
                show-count
                :maxlength="500"
              />
            </n-form-item>
          </n-gi>
        </n-grid>
        <n-form-item label=" " :show-label="false" style="margin-top: 16px;">
          <n-button type="primary" :loading="submitLoading" @click="handleSubmit">
            设置语音位
          </n-button>
        </n-form-item>
      </n-form>
      <div v-if="submitError" class="error-block">
        <n-alert type="error" :title="submitError" />
      </div>
    </n-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: "EcuVoiceIdx" });

import { ref, reactive, computed } from "vue";
import type { FormInst, FormRules } from "naive-ui";
import { createDiscreteApi } from "naive-ui";
import { PlayerPlay } from "@vicons/tabler";
import { setVoiceAPI, cmdEbikeAPI } from "@/api/device";

const { message } = createDiscreteApi(["message"]);

const formRef = ref<FormInst | null>(null);
const submitLoading = ref(false);
const playLoading = ref(false);
const submitError = ref("");

/** 可播放条件：IMEI 15 位且 idx >= 0 */
const canPlay = computed(() => {
  return formData.imei.length === 15 && /^\d{15}$/.test(formData.imei)
    && formData.idx != null && formData.idx >= 0;
});

const formData = reactive({
  imei: "",
  text: "",
  idx: null as number | null,
});

const rules: FormRules = {
  imei: [
    { required: true, message: "请输入 IMEI", trigger: "blur" },
    {
      validator: (_rule, value: string) => value.length === 15 && /^\d{15}$/.test(value),
      message: "IMEI 必须为 15 位数字",
      trigger: "blur",
    },
  ],
  text: [
    { required: true, message: "请输入语音文本", trigger: "blur" },
    { min: 4, message: "语音文本最少 4 个字符", trigger: "blur" },
  ],
  idx: [
    { required: true, type: "number", message: "请输入语音索引", trigger: "blur" },
    { type: "number", min: 0, message: "语音索引最小值为 0", trigger: "blur" },
  ],
};

/** 播放该语音位：下发 C14 指令 */
async function handlePlay() {
  if (!canPlay.value) return;
  playLoading.value = true;
  try {
    const res = await cmdEbikeAPI({
      imei: formData.imei,
      async: false,
      cmd: { c: 14, param: { idx: Number(formData.idx), volume: 100 } },
    }) as { code?: number; msg?: string };
    if (!checkResCode(res)) return;
    message.success("已下发播放指令");
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : String(e);
    message.error(msg || "播放请求失败");
  } finally {
    playLoading.value = false;
  }
}

/** IMEI 仅允许数字 */
function onImeiInput(val: string | null) {
  const next = String(val ?? "").replace(/\D/g, "").slice(0, 15);
  formData.imei = next;
}

/** 校验接口返回 code，不为 0 时 toast 并返回 false */
function checkResCode(res: { code?: number; msg?: string } | null): boolean {
  if (res != null && Number(res.code) !== 0) {
    message.error(res.msg || "请求失败");
    return false;
  }
  return true;
}

/** 提交：设置语音位 */
async function handleSubmit() {
  submitError.value = "";
  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  if (!formData.imei || formData.imei.length !== 15) {
    message.error("请检查 IMEI 正确性（15 位数字）");
    return;
  }
  if (!formData.text || formData.text.length < 4) {
    message.error("语音文本最少 4 个字符");
    return;
  }
  if (formData.idx == null || formData.idx < 0) {
    message.error("语音索引最小值为 0");
    return;
  }

  submitLoading.value = true;
  try {
    const payload: Parameters<typeof setVoiceAPI>[0] = {
      imei: formData.imei,
      text: formData.text.trim(),
      idx: Number(formData.idx),
    };

    const res = await setVoiceAPI(payload) as { code?: number; msg?: string; data?: unknown };
    if (!checkResCode(res)) return;
    message.success("设置语音位成功");
  } catch (e: unknown) {
    const msg = e && typeof e === "object" && "message" in e ? String((e as { message: string }).message) : String(e);
    submitError.value = msg || "设置失败";
    message.error(submitError.value);
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style lang="less" scoped>
.ecu-voice-idx {
  width: 100%;
}

.idx-input {
  flex: 1;
  min-width: 0;
  max-width: 160px;
}

.error-block {
  margin-top: 16px;
}
</style>
