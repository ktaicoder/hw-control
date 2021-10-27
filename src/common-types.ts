import { ISerialPortOperator } from './hw/base-types'

export type HwOperator = ISerialPortOperator

/**
 * 하드웨어
 */
export interface IHw {
    operator: HwOperator
    commands: string[]
    control: () => any
}
