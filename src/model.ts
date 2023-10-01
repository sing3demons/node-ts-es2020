interface User {
  id: string
  username?: string
  email?: string
}

interface Post {
  id: string
  title: string
  content: string
  authors: User[]
}

export { User, Post }
