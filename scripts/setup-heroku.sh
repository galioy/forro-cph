#!/bin/bash

set -eu
ssh-keyscan -H heroku.com >> ~/.ssh/known_hosts

git remote add heroku https://git.heroku.com/$HEROKU_APP_NAME.git

wget -qO- https://cli-assets.heroku.com/install-ubuntu.sh | sh

cat > ~/.netrc << EOF
machine api.heroku.com
login $HEROKU_EMAIL
password $HEROKU_API_KEY
machine git.heroku.com
login $HEROKU_EMAIL
password $HEROKU_API_KEY
EOF

chmod 600 ~/.netrc
