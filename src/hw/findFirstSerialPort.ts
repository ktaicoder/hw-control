import SerialPort from 'serialport'
import { SerialPortOperator } from './base-types'
import { SerialPortHelper } from './SerialPortHelper'
export async function findFirstSerialPort(meta: SerialPortOperator): Promise<SerialPortHelper | undefined> {
    const serialPorts = await SerialPort.list()
    const info = serialPorts.find(meta.isMatch)
    if (info && info.path) {
        return meta.createSerialPortHelper(info.path)
    }
    return undefined
}
