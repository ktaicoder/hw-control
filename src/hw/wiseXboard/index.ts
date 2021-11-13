import { HwKind, IHwInfo } from '@ktaicoder/hw-proto'
import { WiseXboardControl } from './WiseXboardControl'

const HWID = 'wiseXboard'

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

export default {
    hwId: HWID,
    info,
    operator: WiseXboardControl,
    control: () => new WiseXboardControl(),
}
