export * from './hw/base-types'
export * from './common-types'
export * from './hw/findFirstSerialPort'

// 지원 하드웨어 목록
import wiseXboard from './hw/wiseXboard'
import microbit from './hw/microbit'
import wiseXboardPremium from './hw/wiseXboardPremium'

export const controls = {
    [wiseXboard.hwId]: wiseXboard,
    [wiseXboardPremium.hwId]: wiseXboardPremium,
    [microbit.hwId]: microbit,
}
