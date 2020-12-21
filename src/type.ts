export type BookType = {
  name: string
  url: string
  lastUrl: string
} 

export type DataStoreDocumentType = {
  _id: string
  createdAt?: Date
  updatedAt?: Date
}

export type ConfigType = {
  line: number
}