import { HwKind, IHwInfo } from '@aimk/hw-proto'
import SerialPort from 'serialport'
import { ISerialPortInfo } from '../base-types'
import { createSerialPortOperator } from '../createSerialPortOperator'
import { WiseXboardControl } from './WiseXboardControl'

const HWID = 'wise-xboard'

const info: IHwInfo = {
    hwId: HWID,
    hwKind: HwKind.serial,
    hwName: '와이즈 엑스보드',
    category: 'module',
    supportPlatforms: ['win32'],
    pcDrivers: [
        {
            name: 'USB 드라이버',
            'win32-ia32': 'CP210x_Universal_Windows_Driver/CP210xVCPInstaller_x86.exe',
            'win32-x64': 'CP210x_Universal_Windows_Driver/CP210xVCPInstaller_x64.exe',
        },
    ],
}

/**
 * 하드웨어 연결에 대한 도움 클래스
 */
const operator = createSerialPortOperator({
    createSerialPort: function (portInfo: ISerialPortInfo): SerialPort {
        return new SerialPort(portInfo.path, {
            autoOpen: true,
            baudRate: 38400,
            lock: false,
        })
    },

    isMatch: function (portInfo: ISerialPortInfo) {
        return portInfo.manufacturer === 'Silicon Labs'
    },
})

export default {
    hwId: HWID,
    info,
    operator,
    control: () => new WiseXboardControl(),
}
