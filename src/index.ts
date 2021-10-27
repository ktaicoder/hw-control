export * from './hw/base-types'
export * from './common-types'
export * from './hw/findFirstSerialPort'

// 지원 하드웨어 목록
import wiseXboard from './hw/wise-xboard'
import microbit from './hw/microbit'

export const controls = {
    [wiseXboard.hwId]: wiseXboard,
    [microbit.hwId]: microbit,
}
