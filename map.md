

## Iteration #1 | The "Plumbing"

Configure your app.js file with all necessary parts for the Express server to run: dotenv and environment variables, configurations for receiving JSON requests, importing routers and setting the database up, and lastly, initializing the server to listen for HTTP requests.

=> app.js 

## Iteration #2 | API Authentication

💡 Make sure you install all the packages: _bcryptjs_, _jsonwebtoken_ and _express-jwt_. 
=> terminal 
$ npm install bcryptjs
$ npm install jsonwebtoken
$ npm install express-jwt

- Create a Signup endpoint in the backend (don't forget to hash the user's password before writing to the database!); 

=> user.routes.js => route "signup"
=> método createUser() - faz o hash da password (arquivo user.service.js)

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