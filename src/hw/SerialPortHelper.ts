import { Buffer } from 'buffer'
import { filter, firstValueFrom, map, Observable, share, take } from 'rxjs'
import SerialPort from 'serialport'
import Stream from 'stream'

export class SerialPortHelper {
    private _sp: SerialPort
    private _parser: Stream.Transform | null = null
    private _data$: Observable<{ timestamp: number; data: Buffer }> | null = null
    private _closed = false

    constructor(serialPort: SerialPort, parser?: Stream.Transform | null) {
        this._sp = serialPort
        this._parser = parser ?? null
        if (parser) {
            this._sp.pipe(parser)
        }
        this._sp.once('open', this.onOpen)
        this._sp.once('close', this.onClose)
        this._sp.once('end', this.onEnd)
    }

    static create = (serialPort: SerialPort, parser?: Stream.Transform | null): SerialPortHelper => {
        return new SerialPortHelper(serialPort, parser)
    }

    get serialPort(): SerialPort {
        return this._sp
    }

    isReadable = (): boolean => {
        // return this._sp && this._sp.isOpen
        return this._sp && this._sp.readable
    }

    private onOpen = () => {
        console.log('onOpen')
        this._closed = false
    }

    private onClose = () => {
        console.log('onClose')
        this._closed = true
    }

    private onEnd = () => {
        console.log('onEnd')
        this._closed = true
    }

    async write(values: number[]): Promise<void> {
        const succ = this._sp.write(Buffer.from(values))
        if (succ) return
        return new Promise((resolve, reject) => {
            console.log('drain')
            this._sp.drain((err) => {
                if (err) {
                    console.log(err.message)
                    reject(err)
                } else {
                    resolve()
                }
            })
        })
    }

    async readNext(): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                take(1),
                map((it) => it.data),
            ),
        )
    }

    async readFirst(predicate: (data: Buffer) => boolean): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                filter((it) => predicate(it.data)),
                take(1),
                map((it) => it.data),
            ),
        )
    }

    private get data$(): Observable<{ timestamp: number; data: Buffer }> {
        if (this._data$) {
            return this._data$
        }

        const source = this._parser ?? this._sp

        this._data$ = new Observable<{ timestamp: number; data: Buffer }>((subscriber) => {
            const onData = (data: Buffer) => {
                subscriber.next({ timestamp: Date.now(), data })
            }
            source.on('data', onData)
            return () => {
                console.log('data finished')
                source.off('data', onData)
            }
        }).pipe(
            share({
                resetOnError: false,
                resetOnComplete: false,

                // 구독자가 없을때 unsubscribe
                resetOnRefCountZero: true,
            }),
        )
        return this._data$
    }

    close = () => {
        if (this._sp.isOpen) {
            this._sp.close()
        }
    }

    observeData = (): Observable<{ timestamp: number; data: Buffer }> => {
        const now = Date.now()
        return this.data$.pipe(filter((it) => it.timestamp >= now))
    }
}
