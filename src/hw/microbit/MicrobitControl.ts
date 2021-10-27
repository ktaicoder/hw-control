import { IMicrobitControl } from '@aimk/hw-proto'
import SerialPort, { parsers } from 'serialport'
import { SerialPortHelper } from '../SerialPortHelper'

const DEBUG = true

const DELIMITER = Buffer.from([13, 10])

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 서비스
 */
export class MicrobitControl implements IMicrobitControl {
    private _helper: SerialPortHelper | undefined = undefined

    get serialPort(): SerialPort | undefined {
        return this._helper?.serialPort
    }

    set serialPort(port: SerialPort | undefined) {
        if (port) {
            const parser = new parsers.Delimiter({ delimiter: DELIMITER, includeDelimiter: false })
            this._helper = SerialPortHelper.create(port, parser)
        } else {
            this._helper = undefined
        }
    }

    /**
     * @override IHwControl
     * @returns 읽기 가능 여부
     */
    isReadable = (): boolean => {
        return this._helper?.isReadable() === true
    }

    private checkSerialPort(): SerialPortHelper {
        if (!this.isReadable()) {
            throw new Error('hw not open')
        }

        return this._helper!
    }

    async analogRead(): Promise<number[]> {
        const helper = this.checkSerialPort()
        const values = await helper.readNext()
        // [pin1 ~ pin5]
        return new Array(5).fill(0).map((_, i) => values[i] ?? 0)
    }
}
