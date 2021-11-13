import { HwKind, IHwInfo } from '@ktaicoder/hw-proto'
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

export default {
    hwId: HWID,
    info,
    operator: MicrobitControl,
    control: () => new MicrobitControl(),
}
