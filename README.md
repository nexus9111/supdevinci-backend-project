# nodejs_boilerplate_rest_api

🚀 This is all you need as a NodeJS rest API simple and secure boilerplate

## ℹ️ Informations

This api include:

- 📝 Loggers (winston)
- 📚 MongoDB database
- 🪞 PROD and DEV environment
- 🛡 High level of protection (HTTP headers, anti-dos, ip filter, protected routes)
- 🔀 Express routing
- ✨ Structured api

## 🔎 Requirements

- NodeJS installed
- MongoDB database running on your machine
    - You can install it <a href="https://www.mongodb.com/docs/manual/administration/install-community/">here</a>
    - Or run it thanks to my docker compose with command: 
    ```console
    docker-compose build; docker-compose up -d
    ```

## 🛠 Installation

```console
$ git clone git@github.com:nexus9111/nodejs_boilerplate_rest_api.git
$ cd nodejs_boilerplate_rest_api
$ chmod u+x easy-install.sh
$ ./easy-install.sh
```

if `easy-install.sh` does not work:

```console
$ cp .env.example .env.development
$ cp .env.example .env.production
$ npm i
```

- now you can edit `.env.development` and `.env.production` files to fit your needs.

## 🚀 Run

Basic run:

```console
# Run with dev env:
$ npm start

# Run with autoreload dev env:
$ npm run dev

# Run with prod env:
$ npm run prod
```

## ✒️ License:

- Author: Joss C
- Last update: 06/02/2022