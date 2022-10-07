import express from "express"
import { parseNovel } from "./parser"
import * as fs from "fs"
import { join } from "path"
import cors from "cors"

const app = express()

app.use(cors())

const port = 3000

app.get("/", (req, res) => {
  res.send("Hello world!")
})

app.get("/read", (req, res) => {
  res.end(fs.readFileSync(join(__dirname, "./views/novel.html")))
})

app.get("/parse", (req, res) => {
  const url = req.query.url
  if(!url || !url.startsWith("http")){
    res.statusCode = 500;
    res.json({
      message: "url必须是以http开头"
    })
  } else {
    parseNovel(req.query.url, true).then(result => {
      res.json(result)
    })
  }
})

app.use(express.static(join(__dirname, "public")))

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})