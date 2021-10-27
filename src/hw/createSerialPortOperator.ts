import { ISerialPortOperator, SerialPortCreateFn, SerialPortMatchFn } from './base-types'

export const createSerialPortOperator = (params: {
    isMatch: SerialPortMatchFn
    createSerialPort: SerialPortCreateFn
}): ISerialPortOperator => {
    const { isMatch, createSerialPort } = params
    return {
        isMatch,
        createSerialPort,
    }
}
