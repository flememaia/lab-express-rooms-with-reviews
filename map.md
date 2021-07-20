

## Iteration #1 | The "Plumbing"

Configure your app.js file with all necessary parts for the 
### Express server to run:
=> app.js 
```js
const express = require("express");
const app = express();
```
### dotenv and environment variables, 
=> app.js 
```js
require("dotenv").config();
```
=> .env
```env
TOKEN_SIGN_SECRET=xxxxxxxxxxx
```

### configurations for receiving JSON requests, 

=> app.js 
```js
app.use(express.json());

```
### importing routers 

=> app.js
```js
const userRouter = require("./routes/user.routes");
```
=> user.routes

TO BE DEFINED 

and setting the database up, and lastly, 
=> app.js 
```js
const connectToDb = require("./config/db.config");
```
=> db.config 
```js
const mongoose = require("mongoose");

function connectToDb() {
  return mongoose.connect("mongodb://localhost:27017/authIntro", {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
}

module.exports = connectToDb;
```
initializing the server to listen for HTTP requests.

=> app.js 
```js
async function init() {
  try {
    await connectToDb();

    console.log("Conectado ao banco de dados!");

    app.use("/", userRouter);

    app.use((err, req, res) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
    });

    app.listen(4000, () => console.log("Servidor rodando na porta 4000!"));
  } catch (err) {
    console.log("Erro ao conectar ao banco de dados!", err);
    process.exit(1);
  }
}
init();
```

## Iteration #2 | API Authentication

💡 Make sure you install all the packages: _bcryptjs_, _jsonwebtoken_ and _express-jwt_. 
=> terminal 
$ npm install bcryptjs
$ npm install jsonwebtoken
$ npm install express-jwt

- Create a Signup endpoint in the backend (don't forget to hash the user's password before writing to the database!); 

=> user.routes.js => route "signup"
=> método createUser() - faz o hash da password (arquivo user.service.js)

user.route.js
```javascript
const router = require("express").Router();

const UserService = require("../services/user.service");

// Rota de cadastro do usuário
router.post("/signup", async (req, res, next) => {
  try {
    // 0. Extrair as informações do corpo da requisição

    const userService = new UserService(req.body);

    const emailRegex = /[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/g;
    const passwordRegex =
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/g;

    if (!userService.isValid(userService.email, emailRegex)) {
      return res.status(400).json({
        error: "O campo email é obrigatório e deve ser um email válido",
      });
    }

    if (!userService.isValid(userService.password, passwordRegex)) {
      return res.status(400).json({
        error:
          "O campo senha é obrigatório e precisa ter no mínimo 8 caracteres incluindo: letras maiúsculas e minúsculas, números, caracteres especiais.",
      });
    }

    if (await userService.userExists(userService.email)) {
      return res.status(400).json({
        error: "Este e-mail já está cadastrado!",
      });
    }

    //FLÁ método createUser() - faz o hash da password (arquivo user.service.js)
    const insertResult = await userService.createUser();

    // 5. Responde mensagem de sucesso
    // O status 201 significa "Created"
    return res.status(201).json(insertResult);
  } catch (err) {
    next(err);
  }
});
```

- Wire up all the necessary JWT configurations and middlewares for issuing, signing and validating JWTs;

=> criar arquivo .env e .gitignore
=> arquivo .gitignore
    ```
        node_modules/
        package-lock.json
        .env
    ```
=> arquivo user.service.js => issuing, signing and validating JWTs
```javascript
async login() {
    // 1. Buscar o usuário através do email
    const user = await this.getUserByEmail(this.email);

    if (!user) {
      throw new Error("Usuário não cadastrado!"); // throw encerra a execução da função da mesma maneira que o return
    }

    // 2. Comparar a senha recebida da requisição com o hash de senha armazenado no banco
    if (bcrypt.compareSync(this.password, user.passwordHash)) {
      const token = this.generateToken(user);

      return { token: token, user: user };
    }

    return false;
  }

  generateToken(user) {
    // Não esquecer de criar o seu arquivo .env e instalar e configurar o dotenv, porque variáveis de ambiente não são enviadas ao Github por segurança
    const signSecret = process.env.TOKEN_SIGN_SECRET;

    // O token JWT NUNCA pode incluir a senha do usuário pois ele não é criptografado de uma forma irreversível
    delete user.passwordHash;

    // Assina um token JWT
    const token = jwt.sign(user.toJSON(), signSecret, { expiresIn: "6h" });

    return token;
  }
}
```

- Create a Login route, that returns a valid access token to the client;
=> arquivo user.routes.js 
router.post("/login"...)
```javascript
router.post("/login", async (req, res, next) => {
  try {
    const userService = new UserService(req.body);

    const loginResult = await userService.login();
    if (loginResult) {
      return res.status(200).json(loginResult);
    } else {
      // O status 401 significa Unauthorized
      return res.status(401).json({ error: "Acesso negado." });
    }
  } catch (err) {
    next(err);
  }
});
```

- Protect every CRUD route in the backend so only logged in users can access them (only accept requests containing a valid access token in the Authorization header) using our custom middlewares;

=> arquivo isAuthenticated (middlewares) => extrair o token do login
```js
const jwt = require("express-jwt");

function extractTokenFromHeaders(req, res) {
  if (!req.headers.authorization) {
    throw new Error("Cabeçalho inválido: faltando Authorization");
  }

  return req.headers.authorization.split(" ")[1];
}

module.exports = jwt({
  secret: process.env.TOKEN_SIGN_SECRET,
  userProperty: "user",
  getToken: extractTokenFromHeaders,
  algorithms: ["HS256"],
});
```
=> arquivo user.routes.js 
router.get("/profile"...)
```javascript
router.get("/profile", isAuthenticated, async (req, res, next) => {
  try {
    console.log(req.user);

    return res.status(200).json(req.user);
  } catch (err) {
    next(err);
  }
});
```



## Iteration #3 | The CRUD on `room` model

Our rooms will have following schema:

Create a new Model for Room
=> Models/ Room.js
```js
const mongoose = require("mongoose");

const Schema = mongoose.Schema

const roomSchema = new Schema({
  name: { type: String },
  description: { type: String },
  imageUrl: { type: String },
  reviews: [], 
});

module.exports = mongoose.model("Room", roomSchema);
```

When the app is ready, our users should be able to:

- create new rooms
- edit and delete the rooms
- see the list of the rooms

Please proceed to creating all the routes and files necessary for the Room CRUD to work


Create room routes (import Express, define routes and import Room.model)
=> Routes/room.routes.js
```js
const router = require("express").Router();

const RoomModel = require("../models/Room.model");

(...)

module.exports = router;
```

=> app.js
```js
const roomRouter = require("./routes/user.routes");
(...)
app.room(express.json());
(...)
// dentro da função init
app.room("/room", roomRouter);

    app.room((err, req, res) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
    });
```

CRUD
=> Routes/room.routes.js
```js
//Create new rooms
router.post("/room", async (req, res, next) => {
    try {
 
      const addedroom = await RoomModel.create(req.body);
  
      return res.status(200).json(addedroom);
    } catch (err) {
      next(err);
    }
  });

//Edit rooms
router.put("/rooms/:id", async (req, res, next) => {
    try {
      // Encontrar a Room com o id do parametro de rota
      const id = req.params.id;
  
      const editRoom = await RoomModel.findOneAndUpdate(
        { _id: id },
        { $set: { ...req.body } },
        { new: true} 
      );
  
      if (!editRoom) {
        return res.status(404).json({ msg: "Room not found." });
      }
  
      return res.status(200).json(editRoom);
    } catch (err) {
      console.log(err);
      next(err);
    }
  });

  //Delete rooms
  router.delete("/room/:id", async (req, res, next) => {
    try {
      const id = req.params.id;
  
      const deletionResult = await RoomModel.deleteOne({ _id: id });
  
      console.log(deletionResult);
  
      if (deletionResult.n === 0) {
        return res.status(404).json({ msg: "Room not found." });
      }
  
      return res.status(200).json({});
    } catch (err) {
      next(err);
    }
  });

//See the list of the rooms
router.get("/room", async (req, res, next) => {
    try {
 
      const allrooms = await RoomModel.find();
  
      return res.status(200).json(allrooms);
    } catch (err) {
      next(err);
    }
  });
```

## Iteration #3.1 | The `review` model and (optional) CRUD on it
Great, you already have fully functioning CRUD in the backend for the rooms, but we will go one more step: let's create _reviews section_ for each room.

=> create new Model for Review => Models/Review.js
```js
const mongoose = require("mongoose");

const Schema = mongoose.Schema

const reviewSchema = new Schema({
  comment: { type: String, maxlength: 200 },
  roomId: { type: Schema.Types.ObjectId, ref: "Room" },
});

module.exports = mongoose.model("Review", reviewSchema);
```
Now we can go ahead and update `reviews` property in the _roomSchema_:

=> Models/Room.js => update "reviews"key, with the folowing crossreference to reviews.

```js
...
  reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' } ]
...
```
Our users should be able to:

=> Create a review route for CRUD. 
=> Routes/ review.route.js
```js
```

- Make reviews for all the rooms but the ones they created
- Edit and/or delete their comments (optional)
- See the rooms and all the comments


NÃO ESQUECER
- **Models**: user, room, reviews
- **Routes**: auth, rooms, reviews, users (optional, in case you want to add CRUD on users as well)
- **Views**: all the necessary pages so the users can auth themselves and do the CRUD. For easier navigation through your files and consistent naming please organize all the pages into folders (ex. _auth-views_, _room-views_, _comment-views_, ...)