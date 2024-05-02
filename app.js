require('dotenv').config()
const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

app.use(express.json())

const User = require('./models/User') 
const Person = require('./models/person')

app.get('/', (req,res) => {
    res.status(200).json({msg: 'BEM VINDO!'})
})

app.get('/user/:id', checkToken ,async(req, res) => {

    const id = req.params.id

    const user = await User.findById(id,'-password')

    if(!user){
        return res.status(404).json({msg: 'Usuario nao Encontrado!'})
    }

    res.status(200).json({user})
})


function checkToken(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(" ")[1]

    if (!token){
        return res.status(401).json({msg: 'acesso negado!'})
    }

    try{

        const secret = process.env.SECRET

        jwt.verify(token, secret)

        next()

    }catch(error){
        res.status(400).json({msg: 'Token Invalido!'})
    }
}


app.post('/auth/register', async(req,res) => {

    const {name, email, password, confirmpassword} = req.body

    if(!name) {
        return res.status(422).json({msg: 'O Nome e Obrigatorio!'})
    }
    if(!email) {
        return res.status(422).json({msg: 'O Email e Obrigatorio!'})
    }
    if(!password) {
        return res.status(422).json({msg: 'A Senha e Obrigatorio!'})
    }

    if(password !== confirmpassword){
        return res.status(422).json({msg: 'A Senha deve ser iguais!'})
    }

    const userExists = await User.findOne({email: email}) 

    if(userExists) {
        return res.status(422).json({msg: 'Por Favor Utilize Outro E-mail!'})
    }

    const salt = await bcrypt.genSalt(12)
    const passwordhash = await bcrypt.hash(password, salt)

    const user = new User({
        name,
        email,
        password : passwordhash,
    })

    try{
        await user.save()

        res.status(201).json({msg: 'Usuario Cadastrado Com Sucesso!'})

    }catch(error){
        res.status(500).json({msg: error})
    }

})

app.post('/auth/login', async(req, res) => {

    const {email, password} = req.body

    if(!email) {
        return res.status(422).json({msg: 'O Email e Obrigatorio!'})
    }
    if(!password) {
        return res.status(422).json({msg: 'A Senha e Obrigatorio!'})
    }

    const user = await User.findOne({email: email}) 

    if(!user) {
        return res.status(422).json({msg: 'Usuario Nao Encontrado!'})
    }

    const checkpassword = await bcrypt.compare(password, user.password)

    if(!checkpassword) {
        return res.status(422).json({msg: 'Senha Invalida!'})
    }

    try{
        const secret = process.env.SECRET

        const token = jwt.sign(
            {
                id: user._id,
            },
            secret,
        )

        res.status(200).json({msg: 'autenticaçao realizada com sucesso!', token})

    }catch(err){
        res.status(500).json({msg: error})
    }
})


app.post('/person', async (req, res) => {
    const { name, salary, approved } = req.body
  
    const person = {
      name,
      salary,
      approved,
    }
  
    try {
      await Person.create(person)
  
      res.status(201).json({ message: 'Pessoa inserida no sistema com sucesso!' })
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  })
  
  app.get('/person', async (req, res) => {
    try {
      const people = await Person.find()
  
      res.status(200).json(people)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  })
  
  app.get('/person/:id', async (req, res) => {
    const id = req.params.id
  
    try {
      const person = await Person.findOne({ _id: id })
  
      if (!person) {
        res.status(422).json({ message: 'Usuário não encontrado!' })
        return
      }
  
      res.status(200).json(person)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  })
  
  app.patch('/person/:id', async (req, res) => {
    const id = req.params.id
  
    const { name, salary, approved } = req.body
  
    const person = {
      name,
      salary,
      approved,
    }
  
    try {
      const updatedPerson = await Person.updateOne({ _id: id }, person)
  
      if (updatedPerson.matchedCount === 0) {
        res.status(422).json({ message: 'Usuário não encontrado!' })
        return
      }
  
      res.status(200).json(person)
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  })
  
  app.delete('/person/:id', async (req, res) => {
    const id = req.params.id
  
    const person = await Person.findOne({ _id: id })
  
    if (!person) {
      res.status(422).json({ message: 'Usuário não encontrado!' })
      return
    }
  
    try {
      await Person.deleteOne({ _id: id })
  
      res.status(200).json({ message: 'Usuário removido com sucesso!' })
    } catch (error) {
      res.status(500).json({ erro: error })
    }
  })



const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS

mongoose.connect(`mongodb+srv://${dbUser}:${dbPass}@cluster0.xwazvha.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`).then(() => {
    app.listen(3000)
    console.log('conectado ao banco!')
}).catch((err) => console.log(err))

