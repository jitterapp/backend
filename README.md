# Backend for Jitter

# Technologies

- jest (TDD)
- supertest (testing http request)
- eslint (styling)
- prettier (styling)
- nodemon (hot reloading of server)
- sequelize (ORM for maintaining database functions for mysql DB)
- umzug (framework-agnostic migration tool for Node. It provides a clean API for running and rolling back tasks.)
- mysql
- cross-env (makes it so you can have a single command without worrying about setting or using the environment variable properly)
- dotenv (lets you define a set of environment variables)
- express-validator (validations)
- nodemailer (email verofication)
- jest-watch-typeahead (helps with finding tests)
- smtp server (Node.JS module for creating SMTP and LMTP server instances on the fly)
- jwt strategy for auth

### schema [click here](https://dbdiagram.io/d/6065d31fecb54e10c33e507e)
### API documentation [click here](https://documenter.getpostman.com/view/14573449/Tz5iBguJ)
### design of app [click here](https://www.figma.com/file/AsccJfyFTEklKV9SlgZ0wZ/Jitter-Hi-Fi?node-id=0%3A1)

### Setup
Rename .env.example to .env and set environment variables

#### Command to run in terminal to download dependencies
```console
  npm install 
```
#### Command to run tests. When test runner opens you can choose from a multitude of options. 
```console
  npm run test
```
#### Command to start server with hot reloading.  
```development
  npm run dev
```
```production
  npm start
```
#### Use a fake email generator like [this](https://temp-mail.org/en/) when testing smtp post on frontend. For backend we are using [this](https://ethereal.email/)

### Sequelize
All seeders and migrations are executed automatically whenever server is restarted

#### Create Model
```
  node_modules/.bin/sequelize model:generate --name User --attributes firstName:string,lastName:string,email:string
```
#### Running Migrations
```
  node_modules/.bin/sequelize db:migrate
```
#### Undoing Migrations
```
  node_modules/.bin/sequelize db:migrate:undo
```
#### Creating Seed
```
  node_modules/.bin/sequelize seed:generate --name demo-user
```
#### Running Seeds
```
  node_modules/.bin/sequelize db:seed:all
```
#### Undoing Seeds
```
  node_modules/.bin/sequelize db:seed:undo
```
```
  node_modules/.bin/sequelize db:seed:undo:all
```

### Demo User
test@jitter.com / Password123
