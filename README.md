## About
This service has the aim to serve user account registration and login and simple creation of member contacts of the users.

## Getting Started

1. Make sure you have installed:
    * [Node.js & npm](https://github.com/creationix/nvm/blob/master/README.md)
    * [Docker](https://www.docker.com/get-started)
    * [Postgres 10.6](https://www.postgresql.org/download/) (needed for the shell client. The DB server will run in its own container. **Don't forget to test that the `psql` command works**)

2. Create a Docker network for the containers or make sure you have one already (enforced because of OSX hosts):

    The services are placed in a separate Docker network named `forro-network`. Check whether you already have it:

    ```bash
    docker network inspect forro-network
    ```

    If it doesn't exist, create it:

    ```bash
    docker network create forro-network
    ```

3. Install dependencies. Make sure you're in the `/app` dir:

    ```bash
    npm install
    ```
4. Initialize and run the environment.

      ```bash
    cd app/
    npm run init-env
    ```
       
This command will:

* Lift the Redis and Postgres Docker containers
* Create the DBs, the users and the tables and will populate them with some test/dev data

5.
 Start the service
 
 ```
 npm start
 ```
This will:

* (build the Docker image if not existing yet)
* Compile from TypeScript to JavaScript
* Lint the code for formatting errors
* Start the app



##### API entry point - confirming service lift

After a successful lift the base API endpoint is at `http://localhost:7100/`

Test it by calling the ping-endpoint:
```bash
curl -i http://localhost:7100/ping/
```

The teapot should respond with a text string: `"pong"` and HTTP status code `418`

##### Start the service app only (dev env)

`npm start` 

*Note:* the DB containers must be running already. Otherwise you will get connection errors.
    
**If you've already initialized the environment before** and if DB containers are started already, you only need to start the current service container. If you want to re-create the Postgres DB and have it wiped clean, you can use some of the other npm commands provided.
    
***Suggestion:*** look through the scrip commands in the `package.json` file and see the different options for manipulating the environment. This will speed up your development process.

## Testing

1. Create a file with extension `.test.js` inside the `/test/unit` or `/test/integration` folder, depending on whether it's a Unit or Integration test ([difference between Unit and Integration tests](http://stackoverflow.com/questions/5357601/whats-the-difference-between-unit-tests-and-integration-tests#5357837))
    * If it's a *Unit* test, then name it after the function that you're testing with it.
            * Mock all outer dependencies like the input and *calls to other functions within the tested function, and also their returned results*
            * Write tests for both success and error outcomes
    * If it's an *Integration* test, then name it after the module you're testing.
            * Mock only dependencies that you cannot control, like 3rd party functions/services.
            * Write tests for both success and error outcomes

2. The test suite is defined by a `describe()` function where the first argument is the name of the function you're testing (if it is a Unit test) or just the name of the module (if it's an Integration test).

3. Each testing case within the `describe` suite should be enclosed in `it()` function, where the first param is short description of what the test should do. The description should follow the pattern `should <do smth> when <smth happens or is given>`.

If you want to test just one test case or suite, simply append `.only` to it, like this:
```
it.only(...)
```
If you want to omit a test, *temporarily*, for some reason, append `.skip` to it, like this:
```
it.skip(...)
```
## Build and Deploy
The build and deploy are automated mechanisms achieved through a CI/CD pipeline in CircleCI and Heroku.

CircleCI is used for the CI/CD and Heroku is the container registry and hosting platform.

The automatic build is triggered upon pushing to the `master` branch in the GitHub repository. If all build steps succeed, then the container is pushed to Heroku and then released.

#### Adding ENV vars to the app
When adding new environment variables to the app, you should add them in 3 places:

1. The `/scripts/build.sh` script with the following format:

```
--build-arg YOUR_VAR=$YOUR_VAR
```
2.
The `Docker_prod` file as follows:

```
ARG YOUR_VAR
ENV YOUR_VAR=$YOUR_VAR
``` 

3.
The environment variables storage in CircleCI

## Logging
In-app logging in Production environment is piped to LogDNA, for persistent logging purposes.

## Future work
1. Implement DB migrations and a step during deployment that will take care of migrations before the service(s) are lifted (especially needed when the app is scaled accross multiple nodes).
2. Use OAuth, OpenID or other standard for authentication
3. Use some external ENV vars storage (eg. Etcd), so we can easily and dynamically change vars and inject them into the service upon lift, instead of declaring them at build time
4. More generalized middlewares for:

* Incoming/outgoing request/response logging
* which endpoints should be subjected to authorization


6.
 Flags that specify to the `createError` module whether the error is "INTERNAL" or not. This will mean that if it's INTERNAL, then log its original message and data to our persistent logs and then replace the message and data with something general, that can be returned in the response to the user.

