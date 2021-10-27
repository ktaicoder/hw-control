import { HwKind, IHwInfo } from '@aimk/hw-proto'
import SerialPort from 'serialport'
import { ISerialPortInfo } from '../base-types'
import { createSerialPortOperator } from '../createSerialPortOperator'
import { MicrobitControl } from './MicrobitControl'

const HWID = 'microbit'

const info: IHwInfo = {
    hwId: HWID,
    hwKind: HwKind.serial,
    hwName: '마이크로비트',
    homepage: 'https://microbit.org/ko/',
    category: 'board',
    supportPlatforms: ['win32', 'darwin'],
    pcDrivers: [
        {
            name: 'USB 드라이버',
            'win32-ia32': 'mbedWinSerial/mbedWinSerial_16466.exe',
            'win32-x64': 'mbedWinSerial/mbedWinSerial_16466.exe',
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
            baudRate: 115200,
        })
    },

    isMatch: function (portInfo: ISerialPortInfo) {
        return portInfo.manufacturer === 'mbed'
    },
})

export default {
    hwId: HWID,
    info,
    operator,
    control: () => new MicrobitControl(),
}
