import { IWiseXboardControl } from '@aimk/hw-proto'
import SerialPort, { parsers } from 'serialport'
import { SerialPortHelper } from '../SerialPortHelper'

const DEBUG = true

const DELIMITER = Buffer.from([0x52, 0x58, 0x3d, 0x0, 0x0e])

const chr = (ch: string): number => ch.charCodeAt(0)

/**
 * 하드웨어 서비스
 */
export class WiseXboardControl implements IWiseXboardControl {
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

    private async sendPacketMRTEXE(exeIndex: number) {
        const helper = this.checkSerialPort()
        const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, exeIndex, 0, 100, 0]
        for (let i = 6; i < 14; i++) {
            pkt[14] += pkt[i]
        }
        await helper.write(pkt)
    }

    async analogRead(): Promise<number[]> {
        const helper = this.checkSerialPort()
        const values = await helper.readNext()
        // [pin1 ~ pin5]
        return new Array(5).fill(0).map((_, i) => values[i] ?? 0)
    }

    async digitalRead(): Promise<number[]> {
        const values = await this.analogRead()
        // [pin1 ~ pin5]
        return values.map((v) => (v > 100 ? 1 : 0))
    }

    async digitalWrite(pin: 1 | 2 | 3 | 4 | 5, value: number): Promise<void> {
        const helper = this.checkSerialPort()
        value = value > 0 ? 1 : 0

        const pkt = [chr('X'), chr('R'), 2, 0, 0, 0, 0, 0, chr('S')]
        pkt[2 + pin] = value
        console.log(`digitalWrite: pin=${pin}, value=${value}`)
        await helper.write(pkt)
    }

    async setHumanoidMotion(index: number): Promise<void> {
        const helper = this.checkSerialPort()
        const pkt = [0xff, 0xff, 0x4c, 0x53, 0, 0, 0, 0, 0x30, 0x0c, 0x03, index, 0, 100, 0]
        for (let i = 6; i < 14; i++) {
            pkt[14] += pkt[i]
        }
        await helper.write(pkt)
    }

    async dcMotorStop(): Promise<void> {
        const helper = this.checkSerialPort()
        const pkt = [chr('X'), chr('R'), 0, 0, 0, 0, 0, 0, chr('S')]
        await helper.write(pkt)
        await this.sendPacketMRTEXE(2)
    }

    /**
     * 모터 속도 L1,R1,L2,R2 정하기
     * @param l1
     * @param r1
     * @param l2
     * @param r2
     */

    async dcMotorSpeed(l1: number, r1: number, l2: number, r2: number): Promise<void> {
        if (l1 < -10) l1 = -10
        if (r1 < -10) r1 = -10
        if (l2 > 10) l2 = 10
        if (r2 > 10) r2 = 10

        if (l1 < 0) l1 = 256 + l1
        if (l2 < 0) l2 = 256 + l2
        if (r1 < 0) r1 = 256 + r1
        if (r2 < 0) r2 = 256 + r2
        if (DEBUG) console.log('motorspeed : l1:', l1, ',r1:', r1, ', l2:', l2, ',r2:', r2)
        await this._helper.write([chr('X'), chr('R'), 0, l1, r1, l2, r2, 0, chr('S')])

        await this.sendPacketMRTEXE(2)
    }
}
