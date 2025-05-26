<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>
# 🎉 Event Buddy – Event Booking System

A full-stack backend API built using **NestJS**, **PostgreSQL**, and **TypeORM** for managing event creation, booking, and user authentication.


  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

Ensure you have the following installed:

- **Node.js** >= 16.x
- **PostgreSQL** >= 12
- **npm** or **yarn**

**Clone the Repository**

git clone https://github.com/hrmasum99/event-buddy.git
cd event-buddy

## 📦 Install Required Packages

```bash
- npm install class-validator class-transformer
- npm install @nestjs/typeorm typeorm pg
- npm install @nestjs/config
- npm install @nestjs/jwt @nestjs/passport passport passport-jwt
- npm install -D @types/passport-jwt @types/express @types/multer
- npm i -D @types/multer
```

4. ## ⚙️ Environment Configuration

- DATABASE_HOST=localhost
- DATABASE_PORT=5432
- DATABASE_USER=your_postgres_user
- DATABASE_PASSWORD=your_postgres_password
- DATABASE_NAME=eventbuddy

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15d

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
## 🚀 Tech Stack

- **NestJS** – Progressive Node.js framework
- **PostgreSQL** – Relational database
- **TypeORM** – ORM for TypeScript
- **JWT** – Authentication and authorization
- **Swagger** – API documentation
- **Class Validator** – Input validation
- **ConfigModule** – Environment variable support

## 📤 Sample API Endpoints

#### Get all items

| Method | Route                           | Description               |
| ------ | ------------------------------- | ------------------------- |
| POST   | `/auth/register`                | Register new user         |
| POST   | `/auth/login`                   | Login and receive JWT     |
| POST   | `/bookings/new-booking/:id`     | Book seats for an event   |
| DELETE | `/bookings/cancel-booking/:id`  | Cancel a booking          |
| GET    | `/events`                       | List all events           |
| GET    | `/events/:id`                   | Get event by ID           |
| GET    | `/bookings/available-seats/:id` | Get available seats count |

## 📦 Features

- 🔐 JWT-based authentication and role-based authorization (`User`, `Admin`)
- 🧑 User registration and login
- 🎫 Event creation and listing (Admin)
- 📅 Booking system for events (User)
- 📥 Upload and manage event images
- 📊 Swagger API documentation

## 📤 Uploads
Uploaded images are saved in the uploads/ directory (ensure this folder exists and is writable).

##✅ Roles
Role    |	Permissions
──────────────────────────────────────
Admin   |	Create/Update/Delete Events
User    |	Book/Cancel Event, View Events

## 🔐 Authentication & Authorization
- JWT-based login system
- Role-based guards for Admin, User
- Routes protected with @UseGuards(JwtAuthGuard, RolesGuard)

## ⚠️ Notes
- Use Swagger to test and explore all available endpoints.
- Ensure synchronize: true is turned off in production and use migrations instead.
- Bookings are restricted to available seats (1–4 seats max per user).
- Admin-specific routes are protected by role-based guards.

## 💡 Tips
- Make sure PostgreSQL service is running.
- Always validate your DTOs using class-validator.
- Protect sensitive routes using JwtAuthGuard and RolesGuard.
- Keep your .env secure.
  
## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

👤 Author

Developed by Habibur Rahman Masum
- [@hrmasum99](https://www.github.com/hrmasum99)

---
Let me know if you'd like me to:

- generate a Swagger JSON file,
- add a Docker setup for PostgreSQL,
- or create `.env.example` for sharing env template.

Ready to publish on GitHub with confidence! ✅

## 📄 License

This project is licensed under the MIT License.
Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
