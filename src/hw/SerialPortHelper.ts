import { Buffer } from 'buffer'
import {
    BehaviorSubject,
    filter,
    finalize,
    firstValueFrom,
    map,
    mapTo,
    Observable,
    Subject,
    Subscription,
    take,
    tap,
} from 'rxjs'
import SerialPort from 'serialport'
import Stream from 'stream'

const DEBUG = false

type SerialPortState = 'first' | 'opened' | 'closed' | 'ended' | 'error'

export class SerialPortHelper {
    private _sp: SerialPort
    private _parser: Stream.Transform | null = null
    private _data$ = new Subject<{ timestamp: number; data: Buffer }>()
    private _state$ = new BehaviorSubject<SerialPortState>('first')
    private _subscription: Subscription | null = null

    constructor(serialPort: SerialPort, parser?: Stream.Transform | null) {
        this._sp = serialPort
        this._parser = parser ?? null
        if (DEBUG) console.log('SerialPortHelper.create()')
        this._sp.on('open', this.onOpenEvent)
        this._sp.on('close', this.onCloseEvent)
        this._sp.on('end', this.onEnd)
        this._sp.on('error', this.onError)
    }

    static create = (serialPort: SerialPort, parser?: Stream.Transform | null): SerialPortHelper => {
        return new SerialPortHelper(serialPort, parser)
    }

    get serialPort(): SerialPort {
        return this._sp
    }

    isReadable = (): boolean => {
        if (DEBUG) console.log('SerialPortHelper.isOpen()', this._sp && this._sp.isOpen)
        return this._sp && this._sp.isOpen
    }

    async write(values: number[]): Promise<void> {
        if (DEBUG) console.log('SerialPortHelper.write()', values)

        if (!this._sp.isOpen) {
            return new Promise((resolve, reject) => {
                this._sp.once('open', () => {
                    this._sp.write(Buffer.from(values), function (err, bytesWritten) {
                        if (DEBUG) console.log('SerialPortHelper.write(): result = ', { err, bytesWritten })
                        if (err) {
                            reject(err)
                        } else {
                            resolve()
                        }
                    })
                })
            })
        }

        return new Promise((resolve, reject) => {
            this._sp.write(Buffer.from(values), function (err, bytesWritten) {
                if (DEBUG) console.log('SerialPortHelper.write(): result = ', { err, bytesWritten })
                if (err) {
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

    private onCloseEvent = (reason) => {
        if (DEBUG) console.log('SerialPortHelper.onCloseEvent', reason)

        this._subscription?.unsubscribe()
        this._subscription = null
        if (this._parser) {
            this._sp.unpipe(this._parser)
        }
        this._state$.next('closed')
    }

    private onEnd = () => {
        if (DEBUG) console.log('SerialPortHelper.onEnd()')
        this._state$.next('ended')
    }

    private onError = (err) => {
        console.log('SerialPortHelper.onError()', err)
        this._state$.next('error')
    }

    private onOpenEvent = () => {
        if (DEBUG) console.log('SerialPortHelper.onOpenEvent()')

        if (this._parser) {
            this._sp.pipe(this._parser)
        }

        const source = this._parser ?? this._sp

        const src = new Observable<{ timestamp: number; data: Buffer }>((subscriber) => {
            const onData = (data: Buffer) => {
                if (DEBUG) console.log('SerialPortHelper.onData', data)
                subscriber.next({ timestamp: Date.now(), data })
            }

            const onClose = () => {
                subscriber.complete()
            }

            const onError = (err) => {
                console.log('SerialPortHelper.onError(): ', { err })
                subscriber.complete()
            }

            source.on('data', onData)
            source.on('error', onError)
            source.once('close', onClose)
            return () => {
                console.log('serial data monitor finished')
                source.off('data', onData)
                source.off('close', onClose)
                source.off('error', onError)
            }
        })

        this._subscription = src
            .pipe(
                finalize(() => {
                    if (DEBUG) console.log('XXX finalize')
                }),
            )
            .subscribe({
                next: (data) => {
                    if (DEBUG) console.log('data:', data)
                    this._data$.next(data)
                },
                error: (err) => {
                    console.log('err:', err.message)
                },
                complete: () => {},
            })

        this._state$.next('opened')
    }

    isOpenedOrOpening = (): boolean => {
        if (this._sp.isOpen) return true

        if (typeof this._sp['opening'] === 'boolean') {
            return this._sp['opening']
        }
        return false
    }

    isClosedOrClosing = (): boolean => {
        if (typeof this._sp['closing'] === 'boolean') {
            return this._sp['closing']
        }

        if (this._sp.isOpen) {
            return false
        }

        return true
    }

    open = () => {
        if (DEBUG) console.log('SerialPortHelper.open()')
        if (!this.isOpenedOrOpening()) {
            try {
                this._sp.open((err) => {
                    if (err) {
                        console.log('SerialPortHelper.open() ignore error ', err)
                    }
                })
            } catch (ignore) {}
        }
    }

    close = () => {
        if (DEBUG) console.log('SerialPortHelper.close()')
        try {
            // close 체크는 이걸로 해야 한다
            if (this._sp.isOpen) {
                this._sp.close((err) => {
                    if (err) {
                        console.log('SerialPortHelper.close() ignore error ', err)
                    }
                })
            }
        } catch (ignore) {}
    }

    observeData = (): Observable<{ timestamp: number; data: Buffer }> => {
        const now = Date.now()
        const observable = this._data$.pipe(filter((it) => it.timestamp >= now))
        if (DEBUG) {
            return observable.pipe(
                tap((it) => {
                    if (DEBUG) console.log('SerialPortHelper.observeData(), next() = ', it)
                }),
            )
        } else {
            return observable
        }
    }

    observeState = (): Observable<SerialPortState> => {
        return this._state$.asObservable()
    }

    waitUntilOpen = (): Promise<boolean> => {
        return firstValueFrom(
            this._state$.pipe(
                filter((it) => it === 'opened'),
                mapTo(true),
            ),
        )
    }

    destroy = () => {
        console.log('SerialPortHelper.destroy()')
        try {
            this.close()
        } catch (ignore) {}
        this._sp.off('open', this.onOpenEvent)
        this._sp.off('close', this.onCloseEvent)
        this._sp.off('end', this.onEnd)
        this._sp.off('error', this.onError)
    }
}
