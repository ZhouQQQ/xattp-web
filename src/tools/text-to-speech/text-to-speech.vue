<template>
  <c-card>
    <n-space vertical>
      <n-input
        v-model:value="text"
        type="textarea"
        :placeholder="t('tools.text-to-speech.text-placeholder')"
        :autosize="{ minRows: 3, maxRows: 10 }"
      />

      <n-space justify="space-between">
        <n-space>
          <n-select
            v-model:value="selectedVoice"
            :options="voices.map(voice => ({
              label: `${voice.name} (${voice.lang})`,
              value: voice.lang,
            }))"
            :placeholder="t('tools.text-to-speech.select-voice')"
            style="width: 200px"
          />
          
          <n-space align="center" :size="40">
            <n-space vertical align="center">
              <span>{{ t('tools.text-to-speech.rate') }}</span>
              <n-slider v-model:value="rate" :min="0.1" :max="2" :step="0.1" style="width: 100px" />
            </n-space>

            <n-space vertical align="center">
              <span>{{ t('tools.text-to-speech.pitch') }}</span>
              <n-slider v-model:value="pitch" :min="0.1" :max="2" :step="0.1" style="width: 100px" />
            </n-space>

            <n-space vertical align="center">
              <span>{{ t('tools.text-to-speech.volume') }}</span>
              <n-slider v-model:value="volume" :min="0" :max="1" :step="0.1" style="width: 100px" />
            </n-space>
          </n-space>
        </n-space>

        <n-space>
          <n-button :loading="isPlaying" type="primary" @click="handleSpeak">
            {{ isPlaying ? t('tools.text-to-speech.playing') : t('tools.text-to-speech.play') }}
          </n-button>
          <n-button @click="download">
            {{ t('tools.text-to-speech.download') }}
          </n-button>
        </n-space>
      </n-space>
    </n-space>
  </c-card>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useMessage } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { getVoices, speak } from './text-to-speech.service';

const message = useMessage();
const { t } = useI18n();
const text = ref('');
const rate = ref(1);
const pitch = ref(1);
const volume = ref(1);
const voices = ref([]);
const selectedVoice = ref('');
const isPlaying = ref(false);

onMounted(async () => {
  try {
    voices.value = await getVoices();
    if (voices.value.length > 0) {
      const zhVoice = voices.value.find(v => v.lang.includes('zh'));
      selectedVoice.value = zhVoice?.lang || voices.value[0].lang;
    }
  }
  catch (error) {
    message.error(t('tools.text-to-speech.error.get-voices-failed'));
  }
});

async function handleSpeak() {
  if (!text.value) {
    message.warning(t('tools.text-to-speech.error.no-text'));
    return;
  }

  try {
    isPlaying.value = true;
    await speak({
      text: text.value,
      lang: selectedVoice.value,
      rate: rate.value,
      pitch: pitch.value,
      volume: volume.value,
    });
  }
  catch (error) {
    message.error(t('tools.text-to-speech.error.play-failed'));
  }
  finally {
    isPlaying.value = false;
  }
}

async function download() {
  if (!text.value) {
    message.warning(t('tools.text-to-speech.error.no-text'));
    return;
  }

  // 由于浏览器限制，我们无法直接下载合成的语音
  // 但是我们可以自动播放语音，用户可以使用浏览器的录音功能来录制
  try {
    message.info('由于浏览器安全限制，请使用浏览器的录音功能来录制语音');
    await handleSpeak();
  }
  catch (error) {
    message.error(t('tools.text-to-speech.error.play-failed'));
  }
}
</script>