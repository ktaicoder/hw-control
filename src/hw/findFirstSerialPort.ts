import SerialPort from 'serialport'
import { ISerialPortOperator } from './base-types'

export async function findFirstSerialPort(meta: ISerialPortOperator): Promise<SerialPort | undefined> {
    const serialPorts = await SerialPort.list()
    const info = serialPorts.find(meta.isMatch)
    if (info) {
        return meta.createSerialPort(info)
    }
    return undefined
}
