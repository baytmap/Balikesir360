import { TagsFieldNames, IExifElement, ErrorCallback } from './interfaces';
export declare function setErrorByPass(bypass: boolean, errorcallback?: ErrorCallback): void;
export declare const _nLoopStr: (ch: string, num: number) => string;
export declare const pack: (mark: string, array: number[]) => string;
export declare const unpack: (mark: string, str: string) => number[] | null[];
export declare const _isBrowser: any;
export declare const atob: Function;
export declare const btoa: Function;
export declare const _packByte: (array: number[]) => string;
export declare const _packShort: (array: number[]) => string;
export declare const _packLong: (array: number[]) => string;
export declare const copy: <T extends object>(obj: T) => T;
export declare const getThumbnail: (jpeg: string) => string;
export declare const _valueToBytes: (rawValue: any, valueType: number, offset: number) => ITagBinary;
interface ITagBinary {
    value: string;
    lengthBinary: string;
    fourBytesOver: string;
}
export declare const _toByte: (rawValue: any, offset: number) => ITagBinary;
export declare const _toAscii: (rawValue: string, offset: number) => ITagBinary;
export declare const _toShort: (rawValue: any, offset: number) => ITagBinary;
export declare const _toLong: (rawValue: any, offset: number) => ITagBinary;
export declare const _toRational: (rawValue: any, offset: number) => ITagBinary;
export declare const _toUndefined: (rawValue: string, offset: number) => ITagBinary;
export declare const _toSRational: (rawValue: any, offset: number) => ITagBinary;
export declare const dictToBytes: (ifdObj: IExifElement, ifdName: TagsFieldNames, ifdOffsetCount: number) => string[];
export declare class ExifReader {
    tiftag: string;
    endianMark: string;
    constructor(exifBinary: string);
    getIfd: (pointer: number, ifdName: TagsFieldNames) => IExifElement;
    getFirstIfdPointer: (pointer: number, ifdName: TagsFieldNames) => string;
    convertValue: (val: any) => any;
}
export declare const splitIntoSegments: (data: string) => string[];
export declare const mergeSegments: (segments: string[], exif: string) => string;
export {};
