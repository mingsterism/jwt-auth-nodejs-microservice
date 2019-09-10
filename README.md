# JWT Authentication Microservice with NodeJS & MongoDB

This is simple microservice for JWT Authentication with NodeJS & MongoDB.

# How to Use

### Running with Node & Nodemon

```
git clone https://github.com/asepmaulanaismail/jwt-auth-nodejs-microservice
cd jwt-auth-nodejs-microservice/
node server.js
```

or

```
git clone https://github.com/asepmaulanaismail/jwt-auth-nodejs-microservice
cd jwt-auth-nodejs-microservice/
nodemon server.js
```

### Running with Docker

See [how to install docker](https://github.com/asepmaulanaismail/install-docker-ubuntu-shell-script).

```
git clone https://github.com/asepmaulanaismail/jwt-auth-nodejs-microservice
cd jwt-auth-nodejs-microservice/
sudo docker build -t jwt-auth-nodejs:latest .
sudo docker run -d -p 8080:8080 jwt-auth-nodejs
```

# API List:

## Basic Route

Route to show a random message

GET: `localhost:8080/`

Response:

```
Hello! The API is at http://localhost:8080/api
```

## Setup

Create a simple user

GET:   `localhost:8080/setup`

Response:

```Javascript
{
    "success": true
}
```

## Authenticate

Route to authenticate a user

POST:   `localhost:8080/api/authenticate`

Params:

```Javascript
{
    "email": "asepmaulanaismail",
    "password": "asep123!!",
    "deviceId": "1"
}
```

Response:

```Javascript
{
    "success": true,
    "message": "Enjoy your token!",
    "token": "<YOUR TOKEN HERE>"
}
```

## Basic API

Route to show a random message

GET:   `localhost:8080/api`

Params:

```Javascript
{
    "token": "<YOUR TOKEN HERE>",
    "deviceId": "1",
    "email": "asepmaulanaismail"
}
```

Response:

```Javascript
{
    "message": "Welcome to the coolest API on earth!"
}
```

## Verify API

Verify token

POST:   `localhost:8080/api/verify`

Params:

```Javascript
{
    "token": "<YOUR TOKEN HERE>",
    "deviceId": "1",
    "email": "asepmaulanaismail"
}
```

Response:

```Javascript
{
    "success": true,
    "message": ""
}
```

## Users API

Route to return all users

GET:   `localhost:8080/api/users`

Params:

```Javascript
{
    "token": "<YOUR TOKEN HERE>",
    "deviceId": "1",
    "email": "asepmaulanaismail"
}
```

Response:

```Javascript
[
    {
        "_id": "5a5862d28c16852c84d79d78",
        "email": "asepmaulanaismail",
        "password": "asep123!!",
        "admin": true,
        "__v": 0
    }
]
```

## Logout API

Logging out

POST:   `localhost:8080/api/logout`

Params:

```Javascript
{
    "token": "<YOUR TOKEN HERE>",
    "deviceId": "1",
    "email": "asepmaulanaismail"
}
```

Response:

```Javascript
{
    "success": true,
    "message": ""
}
```

