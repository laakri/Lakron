declare module 'argon2-wasm-esm' {
    export interface HashOptions {
      pass: string;
      salt: string | Uint8Array;
      time?: number;
      mem?: number;
      hashLen?: number;
      parallelism?: number;
      type?: ArgonType;
      distPath?: string;
    }
  
    export interface VerifyOptions {
      pass: string;
      encoded: string;
    }
  
    export interface HashResult {
      hash: Uint8Array;
      hashHex: string;
      encoded: string;
    }
  
    export enum ArgonType {
      Argon2d = 0,
      Argon2i = 1,
      Argon2id = 2
    }
  
    export function hash(options: HashOptions): Promise<HashResult>;
    export function verify(options: VerifyOptions): Promise<void>;
  }