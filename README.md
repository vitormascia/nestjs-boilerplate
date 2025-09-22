![Node.js](https://img.shields.io/badge/node-24.8.0-green.svg)
![TypeScript](https://img.shields.io/badge/typescript-^5.9.2-blue.svg)
![@nestjs/core](https://img.shields.io/badge/@nestjs/core-^11.1.6-red.svg)
![@nestjs/cli](https://img.shields.io/badge/@nestjs/cli-^11.0.10-red.svg)
![Jest](https://img.shields.io/badge/jest-^30.1.3-purple.svg)

# 📦 NestJS Boilerplate

This repository contains the implementation of the **Backend Development Hands-On Test**. The goal is to build a simple core system for an REST API.

## 🎛️ Running the app

`1.` Set up your `.env`

```env
#-------------
# Application 
#-------------

APP_NAME="nestjs-boilerplate"
APP_PORT="3000"
NODE_ENV="local"
CORS_ORIGIN="http://localhost:3000,https://production-example.com"

#------------
# PostgreSQL
#------------

POSTGRES_HOST="localhost"
POSTGRES_PORT="5432"
POSTGRES_USERNAME="root"
POSTGRES_PASSWORD="root"
POSTGRES_DATABASE="nestjs-boilerplate"

#------------
# Redis
#------------

REDIS_HOST="localhost"
REDIS_PORT="6379"
LOREM_IPSUM_TTL_IN_SECONDS="300"

#------------
# Throttler
#------------
THROTTLER_LIMIT="100"
THROTTLER_TTL_IN_SECONDS="60"
```

`2.` Set the correct Node.js version via the `.nvmrc` file

```sh
nvm use
```

`3.` Build the app

```sh
npm run build
```

`4.` Rise the containers

```sh
docker compose up -d
```

`5.` Optionally, if you wanna bring the containers down

```sh
docker compose down -v
```

`6.` Run the app on watch mode (don’t worry, migrations auto run on every application launch)

```sh
npm run start:dev
```

`7.` You can check the app health

```sh
curl --request GET \
  --url http://localhost:3000/health
```

## 🧹 Code Quality and Readability

I followed best practices to write **C**lean, **S**ustainable, and **S**calable code — what I like to call CSS. I prioritize clarity and maintainability so others can easily understand and extend the codebase. Plus, I:

- Consistently named variables and functions with purpose and precision to reflect their intent.
- Modularized logic into reusable, single-responsibility functions and components.
- Minimized side effects and embraced predictable patterns by structuring code using consistent, well-known approaches, making debugging and collaboration easier.

## 🧱 Project Architecture

```txt
src/
├── connections/
├── constants/
├── decorators/
├── filters/
├── guards/
├── helpers/
├── interceptors/
├── middlewares/
├── migrations/
├── modules/
│   ├── app/
│   ├── cache/
│   ├── health_check/
│   ├── lorems/
│   ├── redis/
│   └── things/
├── pipes/
└── utils/
```

I designed the project with a clear, modular folder structure to ensure maintainability and scalability. The `src` directory is organized by responsibility — separating concerns like config, logging, database models/schemas, workers, and queues — which keeps logic isolated and easy to navigate.

## 🧠 Tech Choices and Design Decisions

### 🧩 Why NestJS?

I chose NestJS because it's my favorite Node.js framework. It’s like Express or Fastify on steroids (both of which NestJS can run on top of as underlying HTTP platforms, combining their speed with it’s own powerful abstraction layer) — built with TypeScript, powered by strong architecture principles, and backed by an amazing community. NestJS comes with built-in support for modules, decorators, guards, interceptors, DI, testing tools, and much more. The number of out-of-the-box features that NestJS provides significantly accelerates development, allowing you to focus on business logic rather than boilerplate or infrastructure concerns.

### 🛢 Databases - 🐘 PostgreSQL & 🟥 Redis

* **PostgreSQL**: A fine-grained SQL RDBMS.
* **Redis**: An in-memory key–value data store.

### 🔐 Role-Based Access Control (RBAC)

Since the app doesn’t feature a traditional sign-up/sign-in system, I introduced a Basic RBAC layer to control access based on roles. This ensures endpoints are protected while keeping the logic lightweight and spec-compliant.

The system uses one enum to define roles:

* `LoremRole`: `One`, `Two`

So you can, e.g.:

* `LoremRole.One` — Can do common stuff
* `LoremRole.Two` — Can do special stuff

This setup provides a lightweight yet effective authorization layer, keeping the app secure while remaining standards-compliant & while enabling role-based privileges. Access control is enforced through custom decorators and guards, ensuring only users with valid roles can reach protected routes.

### 🌐 CORS and Throttling

I configured CORS globally to ensure that the backend safely accepts requests from trusted frontends. This protects the API from unwanted cross-origin calls, especially in browser environments.

Global throttling limits help mitigate brute-force attacks, spamming, or resource exhaustion, offering basic rate limiting out-of-the-box across all routes.

### 🐳 Docker Setup

I added a `docker-compose.yml` to:

* Quickly bootstrap the project with PostgreSQL and Redis.
* Simplify onboarding for reviewers or other developers.
* Ensure consistency across environments (no “works on my machine” issues).

This makes local development and production deployment easier, faster, and reproducible.
