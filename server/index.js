const express = require('express')
const app = express()
require('dotenv').config()
const cors = require('cors')
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb')
const jwt = require('jsonwebtoken')
const morgan = require('morgan')
const port = process.env.PORT || 8000
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const nodemailer = require('nodemailer')
// middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174','https://travel-lodge-5a0c6.web.app'],
  credentials: true,
  optionSuccessStatus: 200,
}
app.use(
  cors({
  credentials: true, // Allow credentials (cookies, HTTP authentication)
  origin: ['https://travel-lodge-5a0c6.web.app'],
  }),
  );
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token
  console.log(token)
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err)
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}
//send email
const sendEmail = () => {
  //create transporter
  const transporter = nodemailer.createTransport({
    service:'gmail',
    host:'smtp.gmail.com',
    port:587,
    secure:false,
    auth:{
      user: process.env.USER,
      pass: process.env.PASS,
    },
  })
  // verify connection
  transporter.verify((error, success)=>{
    if(error){
      console.log(error);
    }else{
      console.log("Server ready to send email",success );
    }
  })
}

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
})
async function run() {
  sendEmail()
  try {
    const usersCollection = client.db('travelLodgeDb').collection('users')
    const roomsCollecton = client.db('travelLodgeDb').collection('rooms')
    const bookingsCollecton = client.db('travelLodgeDb').collection('bookings')
    //role verificatin moiddlewares
    //for admins
    const verifyAdmin = async (req, res, next) => {
      const user = req.user
      const query = { email: user?.email }
      const result = await usersCollection.findOne(query)
      if (!result || result?.role !== 'admin') return res.status(401).send({ message: 'Unauthorized access' })
      next()
    }
    //for hosts
    const verifyHost = async (req, res, next) => {
      const user = req.user
      const query = { email: user?.email }
      const result = await usersCollection.findOne(query)
      if (!result || result?.role !== 'host') return res.status(401).send({ message: 'Unauthorized access' })
      next()
    }


    // auth related api
    app.post('/jwt', async (req, res) => {
      const user = req.body
      console.log('I need a new jwt', user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '365d',
      })
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })
        .send({ success: true })
    })

    // Logout
    app.get('/logout', async (req, res) => {
      try {
        res
          .clearCookie('token', {
            maxAge: 0,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
          })
          .send({ success: true })
        console.log('Logout successful')
      } catch (err) {
        res.status(500).send(err)
      }
    })

    // Save or modify user email, status in DB
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email: email }
      const options = { upsert: true }
      const isExist = await usersCollection.findOne(query)
      console.log('User found?----->', isExist)
      if (isExist) {
        if (user?.status === "Requested") {
          const result = await usersCollection.updateOne(
            query,
            {
              $set: user
            },
            options
          )
          return res.send(result)

        } else {
          return res.send(isExist)
        }
      }
      const result = await usersCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      )
      res.send(result)
    })

    //get user role
    app.get('/user/:email', async (req, res) => {
      const email = req.params.email
      const result = await usersCollection.findOne({ email })
      res.send(result)
    })

    //Get all rooms
    app.get('/rooms', async (req, res) => {
      const result = await roomsCollecton.find().toArray()
      res.send(result)
    })

    //get rooms for host
    app.get('/rooms/:email', verifyToken, verifyHost, async (req, res) => {
      const email = req.params.email
      const result = await roomsCollecton.find({ 'host.email': email }).toArray()
      res.send(result)

    })

    //get single room data
    app.get('/room/:id', async (req, res) => {
      const id = req.params.id
      const result = await roomsCollecton.findOne({ _id: new ObjectId(id) })
      res.send(result)
    })

    //save room in database

    app.post('/rooms', verifyToken, async (req, res) => {
      const room = req.body
      const result = await roomsCollecton.insertOne(room)
      res.send(result)
    })

    //generate client secret for stripe payment
    app.post('/create-payment-intent', verifyToken, async (req, res) => {
      const { price } = req.body
      const amount = parseInt(price * 100)
      if (!price || amount < 1) return
      const { client_secret } = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],

      })
      res.send({ clientSecret: client_secret })

    })

    //save  booking info in booking collection
    app.post('/bookings', verifyToken, async (req, res) => {
      const booking = req.body
      const result = await bookingsCollecton.insertOne(booking)
      // send email
      res.send(result)
    })
    //update room booking status
    app.patch('/rooms/status/:id', async (req, res) => {
      const id = req.params.id
      const status = req.body.status
      const query = { _id: new ObjectId(id) }
      const updateDoc = {
        $set: {
          booked: status,
        }
      }
      const result = await roomsCollecton.updateOne(query, updateDoc)
      res.send(result)
    })

    //get all bookings for guest
    app.get('/bookings', verifyToken, async (req, res) => {
      const email = req.query.email
      if (!email) return res.send([])
      const query = { 'guest.email': email }
      const result = await bookingsCollecton.find(query).toArray()
      res.send(result)

    })
    //get all bookings for host
    app.get('/bookings/host', verifyToken, verifyHost, async (req, res) => {
      const email = req.query.email
      if (!email) return res.send([])
      const query = { host: email }
      const result = await bookingsCollecton.find(query).toArray()
      res.send(result)

    })

    //get all users 
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await usersCollection.find().toArray()
      res.send(result)
    })

    //update user role
    app.put('/users/update/:email', verifyToken, async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email: email }
      const options = { upsert: true }
      const updateDoc = {
        $set: {
          ...user, timestamp: Date.now(),
        }
      }
      const result = await usersCollection.updateOne(query, updateDoc, options)
      res.send(result)
    })

    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 })
    // console.log(
    //   'Pinged your deployment. You successfully connected to MongoDB!'
    // )
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir)

app.get('/', (req, res) => {
  res.send('Hello from travel lodge Server..')
})

app.listen(port, () => {
  console.log(`TravelLodge is running on port ${port}`)
})
