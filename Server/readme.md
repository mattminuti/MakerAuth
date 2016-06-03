To run the server enviornment variables are needed!

Here is a small shell script that sets up said variables

    #!/bin/bash

    # scipt for starting our accessBot
    clear
    PORT="3000"
    export PORT

    SESSION_SECRET="putyoursupperawesomesecretrighthere"
    export SESSION_SECRET

    MONGODB_URI="mongodb://localhost.makerauth"
    export MONGODB_URI

    echo "Starting the accessBot!"
    # nodemon accessBot.js # reloads server on source change -> sudo npm install -g nodemon
    node accessBot.js
    
"nano start.sh" in Sever this folder, add above code with your own parameters, ctrl-x to save, and "chmod +x start.sh"

To start the server run ./start.sh
