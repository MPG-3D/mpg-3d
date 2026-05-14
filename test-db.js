const { Client } = require("pg")

const client = new Client({
  connectionString: process.env.DATABASE_URL,
})

client.connect()
  .then(() => {
    console.log("DB CONNECTED")
    return client.end()
  })
  .catch(err => {
    console.error("DB ERROR:", err)
  })