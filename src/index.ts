import express from 'express'

import { Kafka } from 'kafkajs'
import { connectToDB, createIndexOnIdField, getPostsAndPopulateAuthor, insertData } from './db'
import { Post } from './model'

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['localhost:9092', 'kafka:9092'],
})

async function main() {
  const db = await connectToDB()
  await createIndexOnIdField(db)

  const consumer = kafka.consumer({ groupId: 'test-group' })
  await consumer.connect()
  await consumer.subscribe({ topic: 'test-topic', fromBeginning: true })

  const app = express()
  app.use(express.json())
  app.get('/add', async (_, res) => {
    const result = await insertData(db)
    res.json({ result })
  })

  app.get('/', async (_, res) => {
    const data: Post[] = await getPostsAndPopulateAuthor(db)
    res.json({ data })
  })

  app.listen(3000, () => console.log('Server is listening on port 3000!'))
}

main()
