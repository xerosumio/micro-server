# Project Overview
This project is worked as a custom framework built using koa for building microservices. It supports mongodb for data management, hosting static files, and provides a robust set of features for building scalable applications.

## Folder Structure
- `/lib`: the source code rests here
- `/lib/helper`: This is the directory for helper functions, where `datap.js` is for handling database management logic, `utils.js` is for helper functions that can be used in many cases, including upload files, datavalidation and more. while the `index.js` is for exporting all helper functions.
- `/lib/config.js`: This file is for configuration settings, including database connection details, server port, and other environment-specific settings.
- `/lib/module.js`: This file is for defining the main application module, route definitions, and other core functionality.
- `/lib/server.js`: This file is for setting up the Koa server, middleware, and other server-related configurations.
- `/test`: This directory is for unit tests and integration tests for the application.

## Coding Standards

- Use semicolons at the end of each statement.
- Use single quotes for strings.

## Libraries and Frameworks

- Koa: The web framework used for building the application.
- MongoDB: The database used for data storage and management.
- Joi: A library for data validation.
- Multer: A middleware for handling file uploads.
- Socket.IO: A library for real-time web applications.
- KOA-SSE-stream: a middleware that handles Server-Sent Events (SSE) in Koa applications.