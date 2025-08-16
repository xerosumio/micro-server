---
mode: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.

# background of the task
because some codebase using this has became monorepo, which the backend development and frontend development will be store in the same repo. meaning the deployment will need the frontend code to be built and put under the static folder of the backend, however, some of it has a server sent event set up and leads to whenever the built static frontend page refresh other than the static root, it will show the server sent events to the client side, so I want to make some changes

# Requirements of the task:
## 1. Separating the API routes, static paths and the Server-sent events
**Description**: I want to add the attribute `apiPrefix` to the configuration, its default is `''`, when it is not `''` it should be used as a prefix for all API routes. And whenever the site is not started with the `apiPrefix`, it should return any existing `index.html` in the static folder for all API routes. Also, the server-sent events should be handled separately from the API routes and static paths, by specifying the `sse.opts.matchPath` in the configuration.

**Success Criteria**:
- The `apiPrefix` is correctly added to the configuration and is used as a prefix for all API routes.
- When the site is not started with the `apiPrefix` if the value is not `''`, any existing `index.html` in the static folder is returned for all API routes.
- Server-sent events are handled separately from API routes and static paths, with the `sse.opts.matchPath` specified in the configuration.