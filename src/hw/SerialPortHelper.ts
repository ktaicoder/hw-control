import { Buffer } from 'buffer'
import {
    BehaviorSubject,
    filter,
    firstValueFrom,
    map,
    mapTo,
    Observable,
    Subject,
    Subscription,
    take,
    takeUntil,
    tap,
    timeout,
} from 'rxjs'
import SerialPort from 'serialport'
import Stream from 'stream'
import { RxSerialPort } from './RxSerialPort'

const DEBUG = false

type SerialPortState = 'first' | 'opened' | 'closed' | 'ended' | 'error'

export class SerialPortHelper {
    private _sp: SerialPort
    private _parser: Stream.Transform | null = null
    private _data$ = new Subject<{ timestamp: number; data: Buffer }>()
    private _state$ = new BehaviorSubject<SerialPortState>('first')
    private _subscription: Subscription | null = null
    private _path?: string | null = null
    private _destroyed$ = new BehaviorSubject<boolean>(false)

    constructor(serialPort: SerialPort, parser?: Stream.Transform | null) {
        this._path = serialPort.path
        this._sp = serialPort
        this._parser = parser ?? null
        if (DEBUG) console.log('SerialPortHelper.create()')
        const subscription = RxSerialPort.fromOpenEvent(this._sp).subscribe(() => {
            this.onOpenEvent()
        })
        subscription.add(
            RxSerialPort.fromCloseEvent(this._sp).subscribe((reason) => {
                if (DEBUG) console.log('SerialPortHelper.onClose()', reason)
                this.onCloseEvent(reason)
            }),
        )
        subscription.add(
            RxSerialPort.fromEndEvent(this._sp).subscribe(() => {
                if (DEBUG) console.log('SerialPortHelper.onEnd()')
                this._state$.next('ended')
            }),
        )
        subscription.add(
            RxSerialPort.fromErrorEvent(this._sp).subscribe((err) => {
                console.log('SerialPortHelper.onError()', err)
                this._state$.next('error')
            }),
        )

        if (this._parser) {
            this._sp.pipe(this._parser)
        }

        const source = this._parser ?? this._sp
        subscription.add(
            RxSerialPort.fromDataEvent(source).subscribe((data: Buffer) => {
                if (DEBUG) console.log('SerialPortHelper.onData', data)
                this._data$.next({ timestamp: Date.now(), data })
            }),
        )
    }

    static create = (serialPort: SerialPort, parser?: Stream.Transform | null): SerialPortHelper => {
        return new SerialPortHelper(serialPort, parser)
    }

    get serialPort(): SerialPort {
        return this._sp
    }

    get serialPortPath(): string | null {
        return this._path ?? null
    }

    private closeTrigger = () => {
        return this._destroyed$.pipe(filter((it) => it === true))
    }

    isReadable = (): boolean => {
        if (DEBUG) console.log('SerialPortHelper.isOpen()', this._sp && this._sp.isOpen)
        return this._sp && this._sp.isOpen
    }

    async write(values: Buffer | number[]): Promise<void> {
        if (DEBUG) console.log('SerialPortHelper.write()', values)

        const sp = this._sp
        try {
            await firstValueFrom(RxSerialPort.write(sp, values).pipe(takeUntil(this.closeTrigger())))
        } catch (ignore) {
            console.log('write fail:' + ignore.message)
        }
    }

    async readNext(): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                take(1),
                map((it) => it.data),
                takeUntil(this.closeTrigger()),
            ),
        )
    }

    async readFirst(predicate: (data: Buffer) => boolean): Promise<Buffer> {
        return firstValueFrom(
            this.observeData().pipe(
                filter((it) => predicate(it.data)),
                take(1),
                map((it) => it.data),
                takeUntil(this.closeTrigger()),
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

    private onError = (err) => {
        console.log('SerialPortHelper.onError()', err)
        this._state$.next('error')
    }

    private onOpenEvent = () => {
        if (DEBUG) console.log('SerialPortHelper.onOpenEvent()')
        this._state$.next('opened')
    }

    isOpened = (): boolean => {
        return this._sp.isOpen
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

    isDestroyed = (): boolean => {
        return this._destroyed$.value
    }

    open = () => {
        if (this._destroyed$.value) {
            throw new Error('serialport helper destroyed, create new one')
        }
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
        if (this._destroyed$.value) {
            console.log('SerialPortHelper.destroy() already destroyed')
        } else {
            this._destroyed$.next(true)
        }
        try {
            // close 체크는 이걸로 해야 한다
            if (this._sp.isOpen) {
                this._sp.close((err) => {
                    if (err) {
                        console.log('SerialPortHelper.close() ignore error ', err)
                    }
                })
            } else {
                console.log('SerialPortHelper.close() already closed')
            }
        } catch (ignore) {}
    }

    observeData = (): Observable<{ timestamp: number; data: Buffer }> => {
        const now = Date.now()

        const observable = this._data$.pipe(
            filter((it) => it.timestamp >= now),
            takeUntil(this.closeTrigger()),
        )
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

    get state(): SerialPortState {
        return this._state$.value
    }

    waitUntilOpen = (timeoutMilli = 0): Promise<boolean> => {
        if (timeoutMilli > 0) {
            return firstValueFrom(
                this._state$.pipe(
                    filter((it) => it === 'opened'),
                    mapTo(true),
                    timeout(timeoutMilli),
                ),
            )
        } else {
            return firstValueFrom(
                this._state$.pipe(
                    filter((it) => it === 'opened'),
                    mapTo(true),
                ),
            )
        }
    }
}
