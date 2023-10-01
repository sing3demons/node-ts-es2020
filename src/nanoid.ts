import { customAlphabet } from 'nanoid'

function nanoid(length: number) {
  return customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', length)()
}

export { nanoid }
