/** CMD82 表单字段定义（协议 HTML Table 97-104，前端写死） */
import type { Bin82ProtocolSchema } from './bin82-protocol';

export const BIN82_PROTOCOL_SCHEMAS: Bin82ProtocolSchema[] = [
  {
    "protocolVer": 1,
    "title": "通用锂电池 BMS (protocolVer=1)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u16",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u16",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "SOC",
        "label": "SOC",
        "type": "u8",
        "description": "电池相对剩余容量百分比，单位%",
        "unit": "%"
      },
      {
        "key": "SOH",
        "label": "SOH",
        "type": "u8",
        "description": "电池健康状态百分比,如无, 默认100",
        "unit": "%"
      },
      {
        "key": "MOSTemp",
        "label": "MOSTemp",
        "type": "i16",
        "description": "MOS温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "MOSState",
        "label": "MOSState",
        "type": "bit8",
        "description": "BMS MOS状态:\nbit[0]: 功能标识:0:无此功能;1:支持\nbit[1]: 充电MOS状态:0:关断;1:导通\nbit[2]: 放电MOS状态:0:关断;1:导通\nbit[3]: 存储状态:0:非存储状态;1:存储状态\nbit[4~7]:预留",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "功能标识:0:无此功能;1:支持"
          },
          {
            "bit": 1,
            "label": "充电MOS状态:0:关断;1:导通"
          },
          {
            "bit": 2,
            "label": "放电MOS状态:0:关断;1:导通"
          },
          {
            "bit": 3,
            "label": "存储状态:0:非存储状态;1:存储状态"
          }
        ]
      },
      {
        "key": "fault",
        "label": "fault",
        "type": "bit32",
        "description": "故障位:详述见fault对照表",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "BIT0"
          },
          {
            "bit": 1,
            "label": "BIT1"
          },
          {
            "bit": 2,
            "label": "BIT2"
          },
          {
            "bit": 3,
            "label": "BIT3"
          },
          {
            "bit": 4,
            "label": "BIT4"
          },
          {
            "bit": 5,
            "label": "BIT5"
          },
          {
            "bit": 6,
            "label": "BIT6"
          },
          {
            "bit": 7,
            "label": "BIT7"
          },
          {
            "bit": 8,
            "label": "BIT8"
          },
          {
            "bit": 9,
            "label": "BIT9"
          },
          {
            "bit": 10,
            "label": "BIT10"
          },
          {
            "bit": 11,
            "label": "BIT11"
          },
          {
            "bit": 12,
            "label": "BIT12"
          },
          {
            "bit": 13,
            "label": "BIT13"
          },
          {
            "bit": 14,
            "label": "BIT14"
          },
          {
            "bit": 15,
            "label": "BIT15"
          },
          {
            "bit": 16,
            "label": "BIT16"
          },
          {
            "bit": 17,
            "label": "BIT17"
          },
          {
            "bit": 18,
            "label": "BIT18"
          },
          {
            "bit": 19,
            "label": "BIT19"
          },
          {
            "bit": 20,
            "label": "BIT20"
          },
          {
            "bit": 21,
            "label": "BIT21"
          },
          {
            "bit": 22,
            "label": "BIT22"
          },
          {
            "bit": 23,
            "label": "BIT23"
          },
          {
            "bit": 24,
            "label": "BIT24"
          },
          {
            "bit": 25,
            "label": "BIT25"
          },
          {
            "bit": 26,
            "label": "BIT26"
          },
          {
            "bit": 27,
            "label": "BIT27"
          },
          {
            "bit": 28,
            "label": "BIT28"
          },
          {
            "bit": 29,
            "label": "BIT29"
          },
          {
            "bit": 30,
            "label": "BIT30"
          },
          {
            "bit": 31,
            "label": "BIT31"
          }
        ]
      },
      {
        "key": "capacity",
        "label": "capacity",
        "type": "u16",
        "description": "电池绝对满充容量 0.1Ah,\n如无，默认0x0000",
        "unit": ""
      },
      {
        "key": "remainCapacity",
        "label": "remainCapacity",
        "type": "u16",
        "description": "电池相对剩余容量 单位: 0.1Ah",
        "unit": "0.1Ah"
      },
      {
        "key": "cycle",
        "label": "cycle",
        "type": "u16",
        "description": "电池循环次数\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "voltage",
        "label": "voltage",
        "type": "u32",
        "description": "总实时电压 单位: mV",
        "unit": "mV"
      },
      {
        "key": "current",
        "label": "current",
        "type": "i16",
        "description": "总实时电流 单位: 0.01A\n(+:放电电流 -:充电电流)\n如定义不同, 做定向转换",
        "unit": "0.01A"
      },
      {
        "key": "insulationResistance",
        "label": "insulationResistance",
        "type": "u16",
        "description": "绝缘电阻 单位KΩ 取值范围0-60000",
        "unit": ""
      },
      {
        "key": "humidity",
        "label": "humidity",
        "type": "u8",
        "description": "湿度 单位:% 范围0-100",
        "unit": "% 范围0-100"
      },
      {
        "key": "timestamp",
        "label": "timestamp",
        "type": "u32",
        "description": "数据时间戳 单位:秒",
        "unit": "秒"
      },
      {
        "key": "cellCount",
        "label": "cellCount",
        "type": "u8",
        "description": "电池串联数量，单位(串)",
        "unit": ""
      }
    ]
  },
  {
    "protocolVer": 2,
    "title": "A科技公司氢电池 (protocolVer=2)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u32",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u32",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature",
        "label": "Hy_Temperature",
        "type": "i16",
        "description": "燃料电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_TotalTime",
        "label": "Hy_TotalTime",
        "type": "u16",
        "description": "燃料电池累计运行时间 单位：0.1h",
        "unit": "0.1h"
      },
      {
        "key": "Hy_RemainWh",
        "label": "Hy_RemainWh",
        "type": "u16",
        "description": "燃料电池可发电量 单位：Wh",
        "unit": "Wh"
      },
      {
        "key": "Hy_OutputWh",
        "label": "Hy_OutputWh",
        "type": "u16",
        "description": "更换氢罐后输出量，单位Wh",
        "unit": ""
      },
      {
        "key": "Hy_SurplusWh",
        "label": "Hy_SurplusWh",
        "type": "u16",
        "description": "更换氢罐后输出量，单位Wh",
        "unit": ""
      },
      {
        "key": "Hy_SurplusKm",
        "label": "Hy_SurplusKm",
        "type": "u16",
        "description": "更换氢罐后剩余里程，单位:km(精度0.1km)",
        "unit": "km(精度0.1km)"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "HyCylinderType",
        "label": "HyCylinderType",
        "type": "u8",
        "description": "氢气瓶类型 0：气态储气罐 1：固态储气罐",
        "unit": ""
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：KPa",
        "unit": "KPa"
      },
      {
        "key": "Film_Heater_Temp",
        "label": "Film_Heater_Temp",
        "type": "i16",
        "description": "薄膜加热片温度 单位：1℃",
        "unit": "1℃"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature",
        "label": "Li_Temperature",
        "type": "i16",
        "description": "锂电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Duration",
        "label": "Li_Duration",
        "type": "u16",
        "description": "锂电池累计工作时间，单位:h（精度0.1）",
        "unit": "h（精度0.1）"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数",
        "unit": ""
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "锂电池剩余电量百分比",
        "unit": "%"
      },
      {
        "key": "Li_remainCapacity",
        "label": "Li_remainCapacity",
        "type": "u16",
        "description": "电池剩余容量 单位：mAh",
        "unit": "mAh"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageDIF",
        "label": "Li_cellVoltageDIF",
        "type": "u16",
        "description": "单体电压压差 单位mV",
        "unit": ""
      },
      {
        "key": "Blower_Speed",
        "label": "Blower_Speed",
        "type": "u16",
        "description": "鼓风机转速 单位rpm",
        "unit": ""
      },
      {
        "key": "Fan_Speed",
        "label": "Fan_Speed",
        "type": "u16",
        "description": "风扇转速 单位rpm",
        "unit": ""
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit8",
        "description": "氢气瓶故障标志位\n*BIT0: 需更换气瓶\n*BIT1: 气瓶过压\n*BIT2: 气瓶泄露\n*BIT3: 燃料电池电堆过温\n*BIT4: 燃料电池低电压\n*BIT5~BIT15: 预留",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "需更换气瓶"
          },
          {
            "bit": 1,
            "label": "气瓶过压"
          },
          {
            "bit": 2,
            "label": "气瓶泄露"
          },
          {
            "bit": 3,
            "label": "燃料电池电堆过温"
          },
          {
            "bit": 4,
            "label": "燃料电池低电压"
          }
        ]
      },
      {
        "key": "Li_fault",
        "label": "Li_fault",
        "type": "bit16",
        "description": "锂电池故障标志位",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "BIT0"
          },
          {
            "bit": 1,
            "label": "BIT1"
          },
          {
            "bit": 2,
            "label": "BIT2"
          },
          {
            "bit": 3,
            "label": "BIT3"
          },
          {
            "bit": 4,
            "label": "BIT4"
          },
          {
            "bit": 5,
            "label": "BIT5"
          },
          {
            "bit": 6,
            "label": "BIT6"
          },
          {
            "bit": 7,
            "label": "BIT7"
          },
          {
            "bit": 8,
            "label": "BIT8"
          },
          {
            "bit": 9,
            "label": "BIT9"
          },
          {
            "bit": 10,
            "label": "BIT10"
          },
          {
            "bit": 11,
            "label": "BIT11"
          },
          {
            "bit": 12,
            "label": "BIT12"
          },
          {
            "bit": 13,
            "label": "BIT13"
          },
          {
            "bit": 14,
            "label": "BIT14"
          },
          {
            "bit": 15,
            "label": "BIT15"
          }
        ]
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "锂电池状态标志位\n*0x01: 充电状态\n*0x02: 放电状态\n*0x03: 储藏状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "充电状态"
          },
          {
            "value": 2,
            "label": "放电状态"
          },
          {
            "value": 3,
            "label": "储藏状态"
          }
        ]
      }
    ]
  },
  {
    "protocolVer": 3,
    "title": "B科技公司氢电池 (protocolVer=3)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "氢电池BMS串号, 不足位后补0x00\n如串号过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u16",
        "description": "氢电池BMS硬件版本后两位\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u16",
        "description": "氢电池BMS软件版本后两位\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "systemState",
        "label": "systemState",
        "type": "u8",
        "description": "0：自检完成待机\n1：自检中\n2：开机中\n3：运行中\n4：关机中\n5：关机完成\n11：保护关机\n12：严重关机\n15：报警\n17：开机故障",
        "unit": ""
      },
      {
        "key": "systemFaultCode",
        "label": "systemFaultCode",
        "type": "u8",
        "description": "系统故障码,见故障表。",
        "unit": ""
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：MPa",
        "unit": "MPa"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "Hy_Concentration",
        "label": "Hy_Concentration",
        "type": "u16",
        "description": "氢浓度 单位：1ppm",
        "unit": "1ppm"
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature1",
        "label": "Hy_Temperature1",
        "type": "i16",
        "description": "燃料电池温度1 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature2",
        "label": "Hy_Temperature2",
        "type": "i16",
        "description": "燃料电池温度2 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_cellVoltageMax",
        "label": "Hy_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_cellVoltageMin",
        "label": "Hy_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_TotalTimeS",
        "label": "Hy_TotalTimeS",
        "type": "u8",
        "description": "燃料电池累计运行时间(s) 单位：1s",
        "unit": "1s"
      },
      {
        "key": "Hy_TotalTimeM",
        "label": "Hy_TotalTimeM",
        "type": "u8",
        "description": "燃料电池累计运行时间(m) 单位：1m",
        "unit": "1m"
      },
      {
        "key": "Hy_TotalTimeH",
        "label": "Hy_TotalTimeH",
        "type": "u16",
        "description": "燃料电池累计运行时间(h) 单位：1h",
        "unit": "1h"
      },
      {
        "key": "Hy_CurrentTimeS",
        "label": "Hy_CurrentTimeS",
        "type": "u8",
        "description": "燃料电池当前运行时间(s) 单位：1s",
        "unit": "1s"
      },
      {
        "key": "Hy_CurrentTimeM",
        "label": "Hy_CurrentTimeM",
        "type": "u8",
        "description": "燃料电池当前运行时间(m) 单位：1m",
        "unit": "1m"
      },
      {
        "key": "Hy_CurrentTimeH",
        "label": "Hy_CurrentTimeH",
        "type": "u16",
        "description": "燃料电池当前运行时间(h) 单位：1h",
        "unit": "1h"
      },
      {
        "key": "Hy_TotalWh",
        "label": "Hy_TotalWh",
        "type": "u16",
        "description": "燃料电池累计发电量 单位：1Wh",
        "unit": "1Wh"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature",
        "label": "Li_Temperature",
        "type": "i16",
        "description": "锂电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "电池剩余容量百分比 单位：1%",
        "unit": "1%"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数 单位：次",
        "unit": "次"
      },
      {
        "key": "Li_FullCapacity",
        "label": "Li_FullCapacity",
        "type": "u16",
        "description": "锂电池满电电量 单位：AH",
        "unit": "AH"
      },
      {
        "key": "Li_SOH",
        "label": "Li_SOH",
        "type": "u8",
        "description": "电池健康度 单位：1%",
        "unit": "1%"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位：mV",
        "unit": "mV"
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位：mV",
        "unit": "mV"
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "0x01: 待机状态\n0x02: 充电状态\n0x03: 放电状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "待机状态"
          },
          {
            "value": 2,
            "label": "充电状态"
          },
          {
            "value": 3,
            "label": "放电状态"
          }
        ]
      },
      {
        "key": "Li_fault",
        "label": "Li_fault",
        "type": "bit16",
        "description": "BIT0: 电池过温\nBIT1: 短路\nBIT2: 放电过流\nBIT3: 充电过流\nBIT4: 总电压欠压\nBIT5: 总电压过压\nBIT6: 单节电池欠压\nBIT7: 单节电池过压\nBIT8: 前端采集错误\nBIT9: 放电低温\nBIT10: 充电低温\nBIT11: 放电过温\nBIT12~BIT15: 预留\n故障位: 0为正常，1为故障",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "电池过温"
          },
          {
            "bit": 1,
            "label": "短路"
          },
          {
            "bit": 2,
            "label": "放电过流"
          },
          {
            "bit": 3,
            "label": "充电过流"
          },
          {
            "bit": 4,
            "label": "总电压欠压"
          },
          {
            "bit": 5,
            "label": "总电压过压"
          },
          {
            "bit": 6,
            "label": "单节电池欠压"
          },
          {
            "bit": 7,
            "label": "单节电池过压"
          },
          {
            "bit": 8,
            "label": "前端采集错误"
          },
          {
            "bit": 9,
            "label": "放电低温"
          },
          {
            "bit": 10,
            "label": "充电低温"
          },
          {
            "bit": 11,
            "label": "放电过温"
          }
        ]
      },
      {
        "key": "timestamp",
        "label": "timestamp",
        "type": "u32",
        "description": "数据时间戳 单位:秒",
        "unit": "秒"
      }
    ]
  },
  {
    "protocolVer": 4,
    "title": "C科技公司氢电池 (protocolVer=4)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u32",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u32",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x0000",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature1",
        "label": "Hy_Temperature1",
        "type": "i16",
        "description": "燃料电池温度1 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature2",
        "label": "Hy_Temperature2",
        "type": "i16",
        "description": "燃料电池温度2 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_TotalTime",
        "label": "Hy_TotalTime",
        "type": "u16",
        "description": "燃料电池累计运行时间 单位：0.1h",
        "unit": "0.1h"
      },
      {
        "key": "Hy_RemainWh",
        "label": "Hy_RemainWh",
        "type": "u16",
        "description": "燃料电池可发电量 单位：Wh",
        "unit": "Wh"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "HyCylinderType",
        "label": "HyCylinderType",
        "type": "u8",
        "description": "氢气瓶类型 0：气态储气罐 1：固态储气罐",
        "unit": ""
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：KPa",
        "unit": "KPa"
      },
      {
        "key": "Fan_speed1",
        "label": "Fan_speed1",
        "type": "u16",
        "description": "风扇转速1",
        "unit": ""
      },
      {
        "key": "Fan_speed2",
        "label": "Fan_speed2",
        "type": "u16",
        "description": "风扇转速2",
        "unit": ""
      },
      {
        "key": "Hy_Concentration",
        "label": "Hy_Concentration",
        "type": "u16",
        "description": "氢浓度 单位：1ppm",
        "unit": "1ppm"
      },
      {
        "key": "Film_Heater_Temp",
        "label": "Film_Heater_Temp",
        "type": "i16",
        "description": "薄膜加热片温度 单位：1℃",
        "unit": "1℃"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature",
        "label": "Li_Temperature",
        "type": "i16",
        "description": "锂电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数",
        "unit": ""
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "锂电池剩余电量百分比",
        "unit": "%"
      },
      {
        "key": "Li_remainCapacity",
        "label": "Li_remainCapacity",
        "type": "u16",
        "description": "电池剩余容量 单位：mAh",
        "unit": "mAh"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageDIF",
        "label": "Li_cellVoltageDIF",
        "type": "u16",
        "description": "单体电压压差 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit8",
        "description": "氢气瓶故障标志位\n*BIT0: 需更换气瓶\n*BIT1: 气瓶过压\n*BIT2: 气瓶泄露\n*BIT3: 燃料电池电堆过温\n*BIT4: 燃料电池低电压\n*BIT5: 燃料电池风扇异常\n*BIT6~BIT15: 预留",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "需更换气瓶"
          },
          {
            "bit": 1,
            "label": "气瓶过压"
          },
          {
            "bit": 2,
            "label": "气瓶泄露"
          },
          {
            "bit": 3,
            "label": "燃料电池电堆过温"
          },
          {
            "bit": 4,
            "label": "燃料电池低电压"
          },
          {
            "bit": 5,
            "label": "燃料电池风扇异常"
          }
        ]
      },
      {
        "key": "Li_fault",
        "label": "Li_fault",
        "type": "bit16",
        "description": "锂电池故障标志位",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "BIT0"
          },
          {
            "bit": 1,
            "label": "BIT1"
          },
          {
            "bit": 2,
            "label": "BIT2"
          },
          {
            "bit": 3,
            "label": "BIT3"
          },
          {
            "bit": 4,
            "label": "BIT4"
          },
          {
            "bit": 5,
            "label": "BIT5"
          },
          {
            "bit": 6,
            "label": "BIT6"
          },
          {
            "bit": 7,
            "label": "BIT7"
          },
          {
            "bit": 8,
            "label": "BIT8"
          },
          {
            "bit": 9,
            "label": "BIT9"
          },
          {
            "bit": 10,
            "label": "BIT10"
          },
          {
            "bit": 11,
            "label": "BIT11"
          },
          {
            "bit": 12,
            "label": "BIT12"
          },
          {
            "bit": 13,
            "label": "BIT13"
          },
          {
            "bit": 14,
            "label": "BIT14"
          },
          {
            "bit": 15,
            "label": "BIT15"
          }
        ]
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "锂电池状态标志位\n*0x01: 充电状态\n*0x02: 放电状态\n*0x03: 储藏状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "充电状态"
          },
          {
            "value": 2,
            "label": "放电状态"
          },
          {
            "value": 3,
            "label": "储藏状态"
          }
        ]
      },
      {
        "key": "DC_voltage",
        "label": "DC_voltage",
        "type": "i16",
        "description": "DC电压单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "DC_current",
        "label": "DC_current",
        "type": "i16",
        "description": "DC电流单位：0.1A",
        "unit": "0.1A"
      },
      {
        "key": "HyActivationState",
        "label": "HyActivationState",
        "type": "u8",
        "description": "活化状态 1为正在活化，0为活化停止",
        "unit": ""
      }
    ]
  },
  {
    "protocolVer": 5,
    "title": "D科技公司氢电池 (protocolVer=5)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u32",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u32",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature",
        "label": "Hy_Temperature",
        "type": "i16",
        "description": "燃料电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_TotalTime",
        "label": "Hy_TotalTime",
        "type": "u16",
        "description": "燃料电池累计运行时间 单位：0.1h",
        "unit": "0.1h"
      },
      {
        "key": "Hy_EnvTempture",
        "label": "Hy_EnvTempture",
        "type": "u16",
        "description": "环境温度(uint16)单位:0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "Hy_EleCtrSysOutCurr",
        "label": "Hy_EleCtrSysOutCurr",
        "type": "u8",
        "description": "电控输出电流,单位:0.1A",
        "unit": "0.1A"
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：KPa",
        "unit": "KPa"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature",
        "label": "Li_Temperature",
        "type": "i16",
        "description": "锂电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数",
        "unit": ""
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "锂电池剩余电量百分比",
        "unit": "%"
      },
      {
        "key": "Li_remainCapacity",
        "label": "Li_remainCapacity",
        "type": "u16",
        "description": "电池剩余容量 单位：mAh",
        "unit": "mAh"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_EleCtrSysOutVolt",
        "label": "Hy_EleCtrSysOutVolt",
        "type": "u16",
        "description": "电控输出电压单位:0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit16",
        "description": "BIT0: 保留\nBIT1: 气瓶过压\nBIT2: 保留\nBIT3: 燃料电池电堆过温\nBIT4: 风扇故障\nBIT5~BIT15: 预留 故障位: 0为正常，1为故障",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "保留"
          },
          {
            "bit": 1,
            "label": "气瓶过压"
          },
          {
            "bit": 2,
            "label": "保留"
          },
          {
            "bit": 3,
            "label": "燃料电池电堆过温"
          },
          {
            "bit": 4,
            "label": "风扇故障"
          },
          {
            "bit": 15,
            "label": "预留 故障位: 0为正常，1为故障"
          }
        ]
      },
      {
        "key": "Hy_reserve",
        "label": "Hy_reserve",
        "type": "u16",
        "description": "保留",
        "unit": ""
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "锂电池状态标志位\n*0x01: 充电状态\n*0x02: 放电状态\n*0x03: 储藏状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "充电状态"
          },
          {
            "value": 2,
            "label": "放电状态"
          },
          {
            "value": 3,
            "label": "储藏状态"
          }
        ]
      }
    ]
  },
  {
    "protocolVer": 6,
    "title": "E科技公司氢电池 (protocolVer=6)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u32",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u32",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature",
        "label": "Hy_Temperature",
        "type": "i16",
        "description": "燃料电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_TotalTime",
        "label": "Hy_TotalTime",
        "type": "u16",
        "description": "燃料电池累计运行时间 单位：0.1h",
        "unit": "0.1h"
      },
      {
        "key": "Hy_EnvTempture",
        "label": "Hy_EnvTempture",
        "type": "u16",
        "description": "环境温度(uint16)单位:0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "Hy_EleCtrSysOutCurr",
        "label": "Hy_EleCtrSysOutCurr",
        "type": "u8",
        "description": "电控输出电流,单位:0.1A",
        "unit": "0.1A"
      },
      {
        "key": "Hy_CylinderTempture",
        "label": "Hy_CylinderTempture",
        "type": "u16",
        "description": "气瓶温度",
        "unit": ""
      },
      {
        "key": "Hy_BottlePress",
        "label": "Hy_BottlePress",
        "type": "u16",
        "description": "气瓶压力，单位KPa",
        "unit": ""
      },
      {
        "key": "Hy_BottleWarm",
        "label": "Hy_BottleWarm",
        "type": "i16",
        "description": "气瓶加热状态，1：加热，0：未加热",
        "unit": ""
      },
      {
        "key": "Hy_EleCtrSysOutVolt",
        "label": "Hy_EleCtrSysOutVolt",
        "type": "i16",
        "description": "电控输出电压单位:0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电电压,单位:0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "锂电池剩余电量百分比,单位：1%",
        "unit": "1%"
      },
      {
        "key": "Hy_FanVoltage",
        "label": "Hy_FanVoltage",
        "type": "u16",
        "description": "氢堆风扇电压,单位:0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_FanDrvPWM",
        "label": "Hy_FanDrvPWM",
        "type": "u16",
        "description": "氢堆风扇驱动占空比,单位:1%",
        "unit": "1%"
      },
      {
        "key": "Hy_FanSpeed",
        "label": "Hy_FanSpeed",
        "type": "u16",
        "description": "氢堆风扇速度反馈,单位:RMP",
        "unit": "RMP"
      },
      {
        "key": "Hy_reserve6",
        "label": "Hy_reserve6",
        "type": "u16",
        "description": "保留",
        "unit": ""
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit16",
        "description": "BIT0: 气瓶温度传感器故障\nBIT1: 气压传感器故障\nBIT2: 气瓶温度过高\nBIT3: 气瓶温度过低\nBIT4: 氢堆温度过高\nBIT5: 氢堆温度过低\nBIT6: 管道压力过大\nBIT7: 管道压力过低\nBIT8: 氢堆电流过大\nBIT9: 电机电压异常\nBIT10: 电机电流过大\nBIT11: FCU温度过高\nBIT12: 风扇故障\nBIT13: 锂电欠压\nBIT14: 锂电过压\nBIT15: FCU故障\n故障位: 0为正常，1为故障",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "气瓶温度传感器故障"
          },
          {
            "bit": 1,
            "label": "气压传感器故障"
          },
          {
            "bit": 2,
            "label": "气瓶温度过高"
          },
          {
            "bit": 3,
            "label": "气瓶温度过低"
          },
          {
            "bit": 4,
            "label": "氢堆温度过高"
          },
          {
            "bit": 5,
            "label": "氢堆温度过低"
          },
          {
            "bit": 6,
            "label": "管道压力过大"
          },
          {
            "bit": 7,
            "label": "管道压力过低"
          },
          {
            "bit": 8,
            "label": "氢堆电流过大"
          },
          {
            "bit": 9,
            "label": "电机电压异常"
          },
          {
            "bit": 10,
            "label": "电机电流过大"
          },
          {
            "bit": 11,
            "label": "FCU温度过高"
          },
          {
            "bit": 12,
            "label": "风扇故障"
          },
          {
            "bit": 13,
            "label": "锂电欠压"
          },
          {
            "bit": 14,
            "label": "锂电过压"
          },
          {
            "bit": 15,
            "label": "FCU故障"
          }
        ]
      },
      {
        "key": "Hy_LimitCurrent",
        "label": "Hy_LimitCurrent",
        "type": "bit8",
        "description": "BIT0: 限流标志\nBIT1: 限流\nBIT2: 不限流\nBIT3~BIT15: 预留",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "限流标志"
          },
          {
            "bit": 1,
            "label": "限流"
          },
          {
            "bit": 2,
            "label": "不限流"
          }
        ]
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "0x01: 充电状态\n0x02: 放电状态\n0x03: 储藏状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "充电状态"
          },
          {
            "value": 2,
            "label": "放电状态"
          },
          {
            "value": 3,
            "label": "储藏状态"
          }
        ]
      }
    ]
  },
  {
    "protocolVer": 7,
    "title": "A科技公司二代氢电池 (protocolVer=7)",
    "fields": [
      {
        "key": "SN",
        "label": "SN",
        "type": "a32",
        "description": "BMS序列号, 不足位后补0x00\n如序列过长, 删减选择变化的上传\n如无, 默认填充0x00",
        "unit": ""
      },
      {
        "key": "manufacturer",
        "label": "manufacturer",
        "type": "a16",
        "description": "厂商名称，不够16位补0x00",
        "unit": ""
      },
      {
        "key": "hardVersion",
        "label": "hardVersion",
        "type": "u32",
        "description": "BMS硬件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "softVersion",
        "label": "softVersion",
        "type": "u32",
        "description": "BMS软件版本\n如定义不同做定向转换\n如无, 默认0x00000000",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature1",
        "label": "Hy_Temperature1",
        "type": "i16",
        "description": "燃料电池温度1 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature2",
        "label": "Hy_Temperature2",
        "type": "i16",
        "description": "燃料电池温度2 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature3",
        "label": "Hy_Temperature3",
        "type": "i16",
        "description": "燃料电池温度3 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature4",
        "label": "Hy_Temperature4",
        "type": "i16",
        "description": "燃料电池温度4 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_TotalTime",
        "label": "Hy_TotalTime",
        "type": "u16",
        "description": "燃料电池累计运行时间 单位：0.1h",
        "unit": "0.1h"
      },
      {
        "key": "Hy_RemainWh",
        "label": "Hy_RemainWh",
        "type": "u16",
        "description": "燃料电池可发电量 单位：Wh",
        "unit": "Wh"
      },
      {
        "key": "Hy_OutputWh",
        "label": "Hy_OutputWh",
        "type": "u16",
        "description": "更换氢罐后输出量，单位Wh",
        "unit": ""
      },
      {
        "key": "Hy_SurplusWh",
        "label": "Hy_SurplusWh",
        "type": "u16",
        "description": "更换氢罐后输出量，单位Wh",
        "unit": ""
      },
      {
        "key": "Hy_SurplusKm",
        "label": "Hy_SurplusKm",
        "type": "u16",
        "description": "更换氢罐后剩余里程，单位:km(精度0.1km)",
        "unit": "km(精度0.1km)"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "HyCylinderType",
        "label": "HyCylinderType",
        "type": "u8",
        "description": "氢气瓶类型 0：气态储气罐 1：固态储气罐",
        "unit": ""
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：KPa",
        "unit": "KPa"
      },
      {
        "key": "Film_Heater_Temp",
        "label": "Film_Heater_Temp",
        "type": "i16",
        "description": "薄膜加热片温度 单位：1℃",
        "unit": "1℃"
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature",
        "label": "Li_Temperature",
        "type": "i16",
        "description": "锂电池温度 单位：0.1摄氏度",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Duration",
        "label": "Li_Duration",
        "type": "u16",
        "description": "锂电池累计工作时间，单位:h（精度0.1）",
        "unit": "h（精度0.1）"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数",
        "unit": ""
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "锂电池剩余电量百分比",
        "unit": "%"
      },
      {
        "key": "Li_remainCapacity",
        "label": "Li_remainCapacity",
        "type": "u16",
        "description": "电池剩余容量 单位：mAh",
        "unit": "mAh"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageDIF",
        "label": "Li_cellVoltageDIF",
        "type": "u16",
        "description": "单体电压压差 单位mV",
        "unit": ""
      },
      {
        "key": "Blower_Speed",
        "label": "Blower_Speed",
        "type": "u16",
        "description": "鼓风机转速 单位rpm",
        "unit": ""
      },
      {
        "key": "Fan_Speed",
        "label": "Fan_Speed",
        "type": "u16",
        "description": "风扇转速 单位rpm",
        "unit": ""
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit8",
        "description": "氢气瓶故障标志位\n*BIT0: 需更换气瓶\n*BIT1: 气瓶过压\n*BIT2: 气瓶泄露\n*BIT3: 燃料电池电堆过温\n*BIT4~BIT15: 预留",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "需更换气瓶"
          },
          {
            "bit": 1,
            "label": "气瓶过压"
          },
          {
            "bit": 2,
            "label": "气瓶泄露"
          },
          {
            "bit": 3,
            "label": "燃料电池电堆过温"
          }
        ]
      },
      {
        "key": "Li_fault",
        "label": "Li_fault",
        "type": "bit16",
        "description": "锂电池故障标志位",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "BIT0"
          },
          {
            "bit": 1,
            "label": "BIT1"
          },
          {
            "bit": 2,
            "label": "BIT2"
          },
          {
            "bit": 3,
            "label": "BIT3"
          },
          {
            "bit": 4,
            "label": "BIT4"
          },
          {
            "bit": 5,
            "label": "BIT5"
          },
          {
            "bit": 6,
            "label": "BIT6"
          },
          {
            "bit": 7,
            "label": "BIT7"
          },
          {
            "bit": 8,
            "label": "BIT8"
          },
          {
            "bit": 9,
            "label": "BIT9"
          },
          {
            "bit": 10,
            "label": "BIT10"
          },
          {
            "bit": 11,
            "label": "BIT11"
          },
          {
            "bit": 12,
            "label": "BIT12"
          },
          {
            "bit": 13,
            "label": "BIT13"
          },
          {
            "bit": 14,
            "label": "BIT14"
          },
          {
            "bit": 15,
            "label": "BIT15"
          }
        ]
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "锂电池状态标志位\n*0x01: 充电状态\n*0x02: 放电状态\n*0x03: 储藏状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "充电状态"
          },
          {
            "value": 2,
            "label": "放电状态"
          },
          {
            "value": 3,
            "label": "储藏状态"
          }
        ]
      }
    ]
  },
  {
    "protocolVer": 8,
    "title": "F科技公司蓝轩氢能 (protocolVer=8)",
    "fields": [
      {
        "key": "manufacturer",
        "label": "manufacturer[16]",
        "type": "u8",
        "description": "厂商名称",
        "unit": ""
      },
      {
        "key": "FCU_model",
        "label": "FCU_model[16]",
        "type": "u8",
        "description": "FCU型号",
        "unit": ""
      },
      {
        "key": "FCU_SN",
        "label": "FCU_SN[16]",
        "type": "u8",
        "description": "FCU串号",
        "unit": ""
      },
      {
        "key": "FCU_hardwareVer",
        "label": "FCU_hardwareVer",
        "type": "u32",
        "description": "FCU硬件版本",
        "unit": ""
      },
      {
        "key": "FCU_softwareVer",
        "label": "FCU_softwareVer",
        "type": "u32",
        "description": "FCU软件版本",
        "unit": ""
      },
      {
        "key": "DCDC_hardwareVer",
        "label": "DCDC_hardwareVer",
        "type": "u32",
        "description": "DCDC硬件版",
        "unit": ""
      },
      {
        "key": "DCDC_softwareVer",
        "label": "DCDC_softwareVer",
        "type": "u32",
        "description": "DCDC软件版",
        "unit": ""
      },
      {
        "key": "BMS_hardwareVer",
        "label": "BMS_hardwareVer",
        "type": "u32",
        "description": "BMS硬件版本",
        "unit": ""
      },
      {
        "key": "BMS_softwareVer",
        "label": "BMS_softwareVer",
        "type": "u32",
        "description": "BMS软件版本",
        "unit": ""
      },
      {
        "key": "systemState",
        "label": "systemState",
        "type": "u8",
        "description": "氢控系统状态标志位\n* 0: 自检完成待机\n* 1: 自检中\n* 2: 开机中\n* 3: 运行中\n* 4: 关机中\n* 5: 关机完成\n* 11: 保护关机\n* 12: 严重关机\n* 15: 报警\n* 17: 开机故障",
        "unit": ""
      },
      {
        "key": "Hy_fault",
        "label": "Hy_fault",
        "type": "bit32",
        "description": "BIT0~BIT31: 预留 * 故障位: 0为正常，1为故障",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "BIT0"
          },
          {
            "bit": 1,
            "label": "BIT1"
          },
          {
            "bit": 2,
            "label": "BIT2"
          },
          {
            "bit": 3,
            "label": "BIT3"
          },
          {
            "bit": 4,
            "label": "BIT4"
          },
          {
            "bit": 5,
            "label": "BIT5"
          },
          {
            "bit": 6,
            "label": "BIT6"
          },
          {
            "bit": 7,
            "label": "BIT7"
          },
          {
            "bit": 8,
            "label": "BIT8"
          },
          {
            "bit": 9,
            "label": "BIT9"
          },
          {
            "bit": 10,
            "label": "BIT10"
          },
          {
            "bit": 11,
            "label": "BIT11"
          },
          {
            "bit": 12,
            "label": "BIT12"
          },
          {
            "bit": 13,
            "label": "BIT13"
          },
          {
            "bit": 14,
            "label": "BIT14"
          },
          {
            "bit": 15,
            "label": "BIT15"
          },
          {
            "bit": 16,
            "label": "BIT16"
          },
          {
            "bit": 17,
            "label": "BIT17"
          },
          {
            "bit": 18,
            "label": "BIT18"
          },
          {
            "bit": 19,
            "label": "BIT19"
          },
          {
            "bit": 20,
            "label": "BIT20"
          },
          {
            "bit": 21,
            "label": "BIT21"
          },
          {
            "bit": 22,
            "label": "BIT22"
          },
          {
            "bit": 23,
            "label": "BIT23"
          },
          {
            "bit": 24,
            "label": "BIT24"
          },
          {
            "bit": 25,
            "label": "BIT25"
          },
          {
            "bit": 26,
            "label": "BIT26"
          },
          {
            "bit": 27,
            "label": "BIT27"
          },
          {
            "bit": 28,
            "label": "BIT28"
          },
          {
            "bit": 29,
            "label": "BIT29"
          },
          {
            "bit": 30,
            "label": "BIT30"
          },
          {
            "bit": 31,
            "label": "BIT31"
          }
        ]
      },
      {
        "key": "HyCylinderPress",
        "label": "HyCylinderPress",
        "type": "u16",
        "description": "氢气瓶压力 单位：MPa",
        "unit": "MPa"
      },
      {
        "key": "Hy_SOC",
        "label": "Hy_SOC",
        "type": "u8",
        "description": "剩余发电量百分比",
        "unit": "%"
      },
      {
        "key": "Hy_Concentration",
        "label": "Hy_Concentration",
        "type": "u16",
        "description": "氢浓度 单位：1ppm",
        "unit": "1ppm"
      },
      {
        "key": "Hy_InletPress",
        "label": "Hy_InletPress",
        "type": "u16",
        "description": "气入堆压力； 单位0.1kPa",
        "unit": ""
      },
      {
        "key": "Hy_voltage",
        "label": "Hy_voltage",
        "type": "u16",
        "description": "燃料电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Hy_current",
        "label": "Hy_current",
        "type": "i16",
        "description": "燃料电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Hy_Temperature_Inlet",
        "label": "Hy_Temperature_Inlet",
        "type": "u16",
        "description": "燃料电池电堆入口温度 单位：0.1摄氏度；偏移量：-40燃料",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_Temperature_Outlet",
        "label": "Hy_Temperature_Outlet",
        "type": "u16",
        "description": "燃料电池电堆出口温度 单位：0.1摄氏度；偏移量：-40燃料",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_cellVoltageMax",
        "label": "Hy_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_cellVoltageMaxChnNO",
        "label": "Hy_cellVoltageMaxChnNO",
        "type": "u8",
        "description": "单体电池最大电压通道号",
        "unit": ""
      },
      {
        "key": "Hy_cellVoltageMin",
        "label": "Hy_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位mV",
        "unit": ""
      },
      {
        "key": "Hy_cellVoltageMinChnNO",
        "label": "Hy_cellVoltageMinChnNO",
        "type": "u8",
        "description": "单体电池最小电压通道号",
        "unit": ""
      },
      {
        "key": "Hy_cellVoltageAvg",
        "label": "Hy_cellVoltageAvg",
        "type": "u16",
        "description": "单体电池平均电压",
        "unit": ""
      },
      {
        "key": "Hy_TotalTimeS",
        "label": "Hy_TotalTimeS",
        "type": "u8",
        "description": "燃料电池累计运行时间(s) 单位： 1s",
        "unit": "1s"
      },
      {
        "key": "Hy_TotalTimeM",
        "label": "Hy_TotalTimeM",
        "type": "u8",
        "description": "燃料电池累计运行时间(m) 单位： 1m",
        "unit": "1m"
      },
      {
        "key": "Hy_TotalTimeH",
        "label": "Hy_TotalTimeH",
        "type": "u16",
        "description": "燃料电池累计运行时间(h) 单位： 1h",
        "unit": "1h"
      },
      {
        "key": "Hy_CurrentTimeS",
        "label": "Hy_CurrentTimeS",
        "type": "u8",
        "description": "燃料电池当前运行时间(s) 单位： 1s",
        "unit": "1s"
      },
      {
        "key": "Hy_CurrentTimeM",
        "label": "Hy_CurrentTimeM",
        "type": "u8",
        "description": "燃料电池当前运行时间(m) 单位： 1m",
        "unit": "1m"
      },
      {
        "key": "Hy_CurrentTimeH",
        "label": "Hy_CurrentTimeH",
        "type": "u16",
        "description": "燃料电池当前运行时间(h) 单位： 1h",
        "unit": "1h"
      },
      {
        "key": "Hy_TotalWh",
        "label": "Hy_TotalWh",
        "type": "u32",
        "description": "燃料电池累计发电量 单位： 0.01kWh",
        "unit": "0.01kWh"
      },
      {
        "key": "Hy_AmbientTemperature",
        "label": "Hy_AmbientTemperature",
        "type": "u16",
        "description": "环境温度温度 单位： 0.1摄氏度；偏移量：-40",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Hy_CoolantCirculation",
        "label": "Hy_CoolantCirculation",
        "type": "bit8",
        "description": "冷却液循环发麻状态\n* BIT0:阀门1\n* BIT1:阀门2\n* 冷却液循环状态位:0为关闭,1为打开",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "阀门1"
          },
          {
            "bit": 1,
            "label": "阀门2"
          }
        ]
      },
      {
        "key": "DC_Temperature",
        "label": "DC_Temperature",
        "type": "u8",
        "description": "DCDC温度 单位： 0.1摄氏度；偏移量：-40DCDC状态",
        "unit": "0.1摄氏度"
      },
      {
        "key": "DC_FaultLevel",
        "label": "DC_FaultLevel",
        "type": "u8",
        "description": "DCDC故障等级",
        "unit": ""
      },
      {
        "key": "DC_FaultCode",
        "label": "DC_FaultCode",
        "type": "u8",
        "description": "DCDC故障码",
        "unit": ""
      },
      {
        "key": "Li_voltage",
        "label": "Li_voltage",
        "type": "u16",
        "description": "锂电池电压 单位：0.1V",
        "unit": "0.1V"
      },
      {
        "key": "Li_current",
        "label": "Li_current",
        "type": "i16",
        "description": "锂电池输出电流 单位：0.1A(放电为正值)",
        "unit": "0.1A(放电为正值)"
      },
      {
        "key": "Li_Temperature_1",
        "label": "Li_Temperature_1",
        "type": "u16",
        "description": "锂电池温度 单位：0.1摄氏度；偏移量：-40",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Temperature_2",
        "label": "Li_Temperature_2",
        "type": "u16",
        "description": "锂电池温度 单位：0.1摄氏度；偏移量：-40",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_Temperature_3",
        "label": "Li_Temperature_3",
        "type": "u16",
        "description": "锂电池温度 单位：0.1摄氏度；偏移量：-40",
        "unit": "0.1摄氏度"
      },
      {
        "key": "Li_SOC",
        "label": "Li_SOC",
        "type": "u8",
        "description": "电池剩余容量百分比 单位：1%",
        "unit": "1%"
      },
      {
        "key": "Li_Cycles",
        "label": "Li_Cycles",
        "type": "u16",
        "description": "锂电池循环次数 单位：次",
        "unit": "次"
      },
      {
        "key": "Li_FullCapacity",
        "label": "Li_FullCapacity",
        "type": "u16",
        "description": "锂电池满电电量 单位：AH",
        "unit": "AH"
      },
      {
        "key": "Li_SOH",
        "label": "Li_SOH",
        "type": "u8",
        "description": "电池健康度 单位：1%",
        "unit": "1%"
      },
      {
        "key": "Li_cellVoltageMax",
        "label": "Li_cellVoltageMax",
        "type": "u16",
        "description": "单体电池最大电压 单位：mV",
        "unit": "mV"
      },
      {
        "key": "Li_cellVoltageMaxChnNO",
        "label": "Li_cellVoltageMaxChnNO",
        "type": "u8",
        "description": "单体电池最大电压通道号",
        "unit": ""
      },
      {
        "key": "Li_cellVoltageMin",
        "label": "Li_cellVoltageMin",
        "type": "u16",
        "description": "单体电池最小电压 单位：mV",
        "unit": "mV"
      },
      {
        "key": "Li_cellVoltageMinChnNO",
        "label": "Li_cellVoltageMinChnNO",
        "type": "u8",
        "description": "单体电池最小电压通道号",
        "unit": ""
      },
      {
        "key": "Li_State",
        "label": "Li_State",
        "type": "enum",
        "description": "锂电池工作状态\n* 0x01: 待机状态\n* 0x02: 充电状态\n* 0x03: 放电状态\n* 0x04: 均衡状态",
        "unit": "",
        "enumOptions": [
          {
            "value": 1,
            "label": "待机状态"
          },
          {
            "value": 2,
            "label": "充电状态"
          },
          {
            "value": 3,
            "label": "放电状态"
          },
          {
            "value": 4,
            "label": "均衡状态"
          }
        ]
      },
      {
        "key": "Li_fault",
        "label": "Li_fault",
        "type": "bit16",
        "description": "锂电池故障码\n* BIT0: 电池过温\n* BIT1: 短路\n* BIT2: 放电过流\n* BIT3: 充电过流\n* BIT4: 总电压欠压\n* BIT5: 总电压过压\n* BIT6: 单节电池欠压\n* BIT7: 单节电池过压\n* BIT8: 前端采集错误\n* BIT9: 放电低温\n* BIT10: 充电低温\n* BIT11: 放电过温\n* BIT12~BIT15: 预留\n* 故障位: 0为正常，1为故障",
        "unit": "",
        "bits": [
          {
            "bit": 0,
            "label": "电池过温"
          },
          {
            "bit": 1,
            "label": "短路"
          },
          {
            "bit": 2,
            "label": "放电过流"
          },
          {
            "bit": 3,
            "label": "充电过流"
          },
          {
            "bit": 4,
            "label": "总电压欠压"
          },
          {
            "bit": 5,
            "label": "总电压过压"
          },
          {
            "bit": 6,
            "label": "单节电池欠压"
          },
          {
            "bit": 7,
            "label": "单节电池过压"
          },
          {
            "bit": 8,
            "label": "前端采集错误"
          },
          {
            "bit": 9,
            "label": "放电低温"
          },
          {
            "bit": 10,
            "label": "充电低温"
          },
          {
            "bit": 11,
            "label": "放电过温"
          }
        ]
      }
    ]
  }
];
