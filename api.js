const {ObjectId} = require('mongodb')
const express = require('express')
const app = new express
const MongoClient = require("mongodb").MongoClient
const mongoClient = new MongoClient("mongodb://localhost:27017/", {useUnifiedTopology: true})
const cors = require('cors')
app.use(cors())
let dbClient
let adminDb

mongoClient.connect((err, client) => {
    if (err) return console.log(err)
    dbClient = client
    app.locals.db = dbClient
    adminDb = client.db().admin()
    app.listen(3000, function () {
        console.log("Сервер ожидает подключения...")
    })
})

app.get("/dbs", (req, res) => {
    adminDb.listDatabases((err, result) =>{
        let newResult = []
        for (let value of result.databases){
            if ((value.name !== "admin") && (value.name !== "local") && (value.name !== "config"))
                newResult.push(value.name)
        }
        res.send(newResult)
    })
})

app.post("/get-base", (req, res) => {
    let jsonBody = ""
    req.on('data', chunk => {
        jsonBody += chunk.toString()
    })
    req.on('end', () => {
        app.locals.db = dbClient.db(jsonBody)
    })
})

app.get("/all-collections", (req, res) => {
    let collections = app.locals.db
    collections.listCollections().toArray((err, arr) => {
        res.send(arr)
    })
})

app.get("/get-collection/:collection", (req, res) => {
    let collectionNameTemp = String(req.params.collection)
    let collectionName = ""
    for (let i = 1; i < collectionNameTemp.length; i++)
        collectionName += collectionNameTemp[i]
    let collection = app.locals.db.collection(collectionName)
    collection.find().toArray((err, arr) => {
        res.send(arr)
    })
})

app.post("/post-new-data/:collection", (req, res) => {
    let jsonBody = ""
    req.on('data', chunk => {
        jsonBody += chunk.toString()
    })
    req.on('end', () => {
        let collectionNameTemp = String(req.params.collection)
        let collectionName = ""
        for (let i = 1; i < collectionNameTemp.length; i++)
            collectionName += collectionNameTemp[i]
        let body = JSON.parse(jsonBody)
        let collection = app.locals.db.collection(collectionName)
        collection.insertOne(body)
    })
})

app.post("/delete-data/:collection", (req, res) => {
    let jsonBody = ""
    req.on('data', chunk => {
        jsonBody += chunk.toString()
    })
    req.on('end', () => {
        let collectionNameTemp = String(req.params.collection)
        let collectionName = ""
        for (let i = 1; i < collectionNameTemp.length; i++)
            collectionName += collectionNameTemp[i]
        let body = JSON.parse(jsonBody)
        let collection = app.locals.db.collection(collectionName)
        collection.deleteOne({_id: ObjectId(body._id)})
    })
})

app.post("/update-data/:collection", (req, res) => {
    let jsonBody = ""
    req.on('data', chunk => {
        jsonBody += chunk.toString()
    })
    req.on('end', () => {
        let collectionNameTemp = String(req.params.collection)
        let collectionName = ""
        for (let i = 1; i < collectionNameTemp.length; i++)
            collectionName += collectionNameTemp[i]
        let body = JSON.parse(jsonBody)
        let keys = Object.keys(body)
        let collection = app.locals.db.collection(collectionName)
        let data = {}
        for (let value of keys) {
            if (value !== "_id")
                data = {[value]: body[value]}
        }
        collection.updateOne({_id: ObjectId(body._id)}, {$set: data}, () => {
            data = {}
        })
    })
})

app.listen(3002, () => {
    console.log("server is listening")
})