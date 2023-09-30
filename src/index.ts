import express from 'express'
import { customAlphabet } from 'nanoid'

function nanoid(length: number) {
  return customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', length)()
}
const app = express()

app.get('/', (_, res) => {
  const id = nanoid(10)
  res.send('Hello World!' + id)
})

app.listen(3000, () => {
  console.log('Server is listening on port 3000!')
})
