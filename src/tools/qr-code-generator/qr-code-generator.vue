<script setup lang="ts">
import { useMessage } from 'naive-ui';
import type { QRCodeErrorCorrectionLevel } from 'qrcode';
import type { Ref } from 'vue';
import { useQRCode } from './useQRCode';
import { useDownloadFileFromBase64 } from '@/composable/downloadBase64';

const message = useMessage();
const foreground = ref('#000000ff');
const background = ref('#ffffffff');
const errorCorrectionLevel = ref<QRCodeErrorCorrectionLevel>('medium');

interface Demo {
  name: string;
  text: Ref<string>;
  qrcode: Ref<string>;
}

const demoConfigs = [
  {
    name: '共享示例',
    text: 'https://ebike-dianlv.xiaoantech.com?carId=100600033',
  },
  {
    name: '中控示例',
    text: 'IMEI:864946062831689 SN:OO1856660014',
  },
  {
    name: '智能车示例-线上',
    text: 'https://smart-gateway.xiaoantech.com?licenseNo=10000000000000008',
  },
  {
    name: '智能车示例-dev',
    text: 'https://dev-smart-gateway.xiaoantech.com?licenseNo=100000000000002028',
  },
];

const demos = reactive(demoConfigs.map((config) => {
  const text = ref(config.text);
  const { qrcode } = useQRCode({
    text,
    color: { background, foreground },
    errorCorrectionLevel,
    options: { width: 1024 },
  });
  
  return {
    name: config.name,
    text,
    qrcode,
  } as Demo;
}));

async function downloadQRCode(demo: Demo) {
  try {
    const qrcodeResult = useQRCode({
      text: demo.text,
      color: {
        background,
        foreground,
      },
      errorCorrectionLevel,
      options: { width: 1024 },
    });

    // 等待下一个 tick，确保二维码已生成
    await nextTick();
    
    if (!qrcodeResult.qrcode.value) {
      throw new Error('二维码生成失败');
    }

    const { download } = useDownloadFileFromBase64({
      source: qrcodeResult.qrcode,
      filename: `${demo.name}-qr-code.png`,
    });
    
    download();
    message.success('二维码下载成功');
  } 
  catch (error) {
    console.error('下载二维码时出错:', error);
    message.error('下载二维码失败，请重试');
  }
}
</script>

<template>
  <c-card v-for="demo in demos" :key="demo.name">
    <n-grid x-gap="12" y-gap="12" cols="1 600:3">
      <n-gi span="2">
        <c-input-text
          v-model:value="demo.text"
          label-position="left"
          label-width="130px"
          label-align="right"
          :label="demo.name"
          multiline
          rows="1"
          autosize
          placeholder="Your link or text..."
          mb-6
        />
      </n-gi>
      <n-gi>
        <div flex flex-col items-center gap-3>
          <n-image :src="demo.qrcode" width="200" />
          <c-button @click="() => downloadQRCode(demo)">
            下载二维码
          </c-button>
        </div>
      </n-gi>
    </n-grid>
  </c-card>
</template>
