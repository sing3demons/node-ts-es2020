import { Db, MongoClient } from 'mongodb'
import { nanoid } from './nanoid'
import { Post, User } from './model'
const uri = 'mongodb://localhost:27017,localhost:27018,localhost:27019/my-database?replicaSet=my-replica-set'
const client = new MongoClient(uri)

async function connectToDB() {
  try {
    await client.connect()
    console.log('Connected to MongoDB replica set')
    return client.db()
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    process.exit(1)
  }
}

async function createIndexOnIdField(db: Db) {
  try {
    const usersCollection = db.collection('users')
    usersCollection.createIndex({ id: 1 }, { unique: true })
    const postsCollection = db.collection('posts')
    postsCollection.createIndex({ id: 1 }, { unique: true })
  } catch (error) {
    console.error('Error creating index:', error)
    throw error
  }
}

interface createPost {
  id: string
  title: string
  content: string
  authors: string[]
}

async function insertData(db: Db) {
  try {
    const usersCollection = db.collection('users')
    const postsCollection = db.collection('posts')

    // Insert users
    const user1: User = { username: 'user1', email: 'user1@example.com', id: nanoid(11) }
    const user2 = { username: 'user2', email: 'user2@example.com', id: nanoid(11) }
    const user3 = { username: 'user3', email: 'user3@example.com', id: nanoid(11) }
    const users = await usersCollection.insertMany([user1, user2, user3])

    // Insert posts with an array of authors
    const posts: createPost[] = []
    for (let i = 0; i < 7000; i++) {
      posts.push({
        id: nanoid(11),
        title: `Post ${i}`,
        content: `Content ${i}`,
        authors: [user1.id, user3.id],
      })
    }
    for (let i = 7000; i < 14000; i++) {
      posts.push({
        id: nanoid(11),
        title: `Post ${i}`,
        content: `Content ${i}`,
        authors: [user1.id, user2.id],
      })
    }

    for (let i = 14000; i < 20000; i++) {
      posts.push({
        id: nanoid(11),
        title: `Post ${i}`,
        content: `Content ${i}`,
        authors: [user3.id, user2.id],
      })
    }
    const insertManyResult = await postsCollection.insertMany(posts)
    return { users, posts: insertManyResult }
  } catch (error) {
    console.error('Error inserting data:', error)
    throw error
  }
}

async function getPostsAndPopulateAuthor(db: Db): Promise<Post[]> {
  try {
    const limit = 50
    const postsCollection = db.collection<Post>('posts')
    const postsWithAuthors = await postsCollection
      .aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'authors',
            foreignField: 'id',
            as: 'authors',
          },
        },
        {
          $project: {
            _id: 0,
            id: 1,
            title: 1,
            content: 1,
            authors: {
              $map: {
                input: '$authors',
                as: 'author',
                in: {
                  username: '$$author.username',
                  email: '$$author.email',
                  id: '$$author.id',
                },
              },
            },
          },
        },
        {
          $limit: limit ? limit : 15,
        },
      ])
      .toArray()

    // console.log(JSON.stringify(postsWithAuthors))
    return postsWithAuthors as Post[]
  } catch (error) {
    console.error('Error querying and populating data:', error)
    throw error
  } finally {
    // client.close()
  }
}

export { connectToDB, createIndexOnIdField, getPostsAndPopulateAuthor, insertData }
