FROM node:10.9.0

WORKDIR /app

ADD app /app

# A fix for local development only. Needed because 'bcrypt' differs when installed on OSX and Linux,
# therefore creating problems when I install the npm modules on the Mac but run the app in the Docker container (Linux)
RUN rm -rf node_modules/
RUN npm install
