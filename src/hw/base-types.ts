import SerialPort from 'serialport'

/**
 * 시리얼포트 정보
 * serialport 모듈의 SerialPort.PortInfo와 동일하다
 * 라이브러리 의존성을 없애기 위해 같은 형태로 만들었다
 */
export interface ISerialPortInfo {
    path: string
    manufacturer?: string | undefined
    serialNumber?: string | undefined
    pnpId?: string | undefined
    locationId?: string | undefined
    productId?: string | undefined
    vendorId?: string | undefined
}

export type SerialPortMatchFn = (portInfo: ISerialPortInfo) => boolean
export type SerialPortCreateFn = (portInfo: ISerialPortInfo) => SerialPort

/**
 * 시리얼 포트 하드웨어의 메타 정보
 */
export interface ISerialPortOperator {
    isMatch: SerialPortMatchFn
    createSerialPort: SerialPortCreateFn
}
