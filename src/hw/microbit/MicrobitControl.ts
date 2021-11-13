import { IMicrobitControl } from '@ktaicoder/hw-proto'
import SerialPort, { parsers } from 'serialport'
import { IHwContext, ISerialPortInfo } from '../base-types'
import { SerialPortHelper } from '../SerialPortHelper'

const DEBUG = true

const DELIMITER = Buffer.from([13, 10])

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 서비스
 */
export class MicrobitControl implements IMicrobitControl {
    private _context: IHwContext | null = null

    static createSerialPortHelper = (path: string): SerialPortHelper => {
        const sp = new SerialPort(path, {
            autoOpen: true,
            baudRate: 115200,
        })
        const parser = new parsers.Delimiter({ delimiter: DELIMITER, includeDelimiter: false })
        return SerialPortHelper.create(sp, parser)
    }

    static isMatch = (portInfo: ISerialPortInfo): boolean => {
        return portInfo.manufacturer === 'mbed'
    }

    private get serialPortHelper(): SerialPortHelper | undefined {
        return this._context?.provideSerialPortHelper?.()
    }

    /**
     * @override IHwControl
     * @returns 읽기 가능 여부
     */
    isReadable = (): boolean => {
        return this.serialPortHelper?.isReadable() === true
    }

    private checkSerialPort(): SerialPortHelper {
        if (!this.isReadable()) {
            throw new Error('hw not open')
        }

        return this.serialPortHelper!
    }

    async analogRead(): Promise<number[]> {
        const helper = this.checkSerialPort()
        const values = await helper.readNext()
        // [pin1 ~ pin5]
        return new Array(5).fill(0).map((_, i) => values[i] ?? 0)
    }
}
