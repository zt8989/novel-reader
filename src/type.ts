export type BookType = {
  name: string
  lastUrl: string
} 

export type DataStoreDocumentType = {
  _id: string
  createdAt?: Date
  updatedAt?: Date
}

export type ConfigType = {
  lastUrl?: string
  lastLine?: number
  line?: number,
  baseUrl?: string,
  token?: string
}