# Backend for Jitter

# Technologies

- jest (TDD)
- supertest (testing http request)
- eslint (styling)
- prettier (styling)
- nodemon (hot reloading of server)
- sequelize (ORM for maintaining database functions for sqlite3 DB)
- sqlite3
- cross-env (makes it so you can have a single command without worrying about setting or using the environment variable properly)
- config (lets you define a set of default parameters, and extend them for different deployment environments)
- express-validator (validations)
- nodemailer (email verofication)
- jest-watch-typeahead (helps with finding tests)
- smtp server (Node.JS module for creating SMTP and LMTP server instances on the fly)
- jwt strategy for auth



### schema [click here](https://dbdiagram.io/d/5fb86c243a78976d7b7ccee3)
### API documentation [click here](https://www.getpostman.com/collections/ccd93ffb1551659286e4)
### design of app [click here](https://www.figma.com/file/AsccJfyFTEklKV9SlgZ0wZ/Jitter-Hi-Fi?node-id=0%3A1)





### Setup

#### Command to run in terminal to download dependencies
```console
  npm install 
```
#### Command to run tests. When test runner opens you can choose from a multitude of options. 
```console
  npm run test
```
#### Command to start server with hot reloading.  
```console
  npm run start
```
#### Use a fake email generator like [this](https://temp-mail.org/en/) when testing smtp post on frontend. For backend we are using [this](https://ethereal.email/)
