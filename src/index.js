const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find((userItem) => userItem.username === username);

  if (!user) {
    return response.status(400).send({ error: "User not found" });
  }
  request.user = user;
  return next();
}

function checksExistsToDo(request, response, next) {
  const { user } = request;
  const { id } = request.params;
  const toDoIndex = user.todos.findIndex((todoItem) => todoItem.id === id);

  if (toDoIndex === -1)
    return response.status(404).send({ error: "todo not exists" });

  return next();
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;
  const userAlreadyExists = users.find(
    (userItem) => userItem.username === username
  );
  if (userAlreadyExists)
    return response.status(400).send({ error: "user already exists" });

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(user);

  return response.status(201).send(user);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  return response.status(200).json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const { title, deadline } = request.body;
  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline,
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  return response.status(201).send(newTodo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsToDo,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;
    const { title, deadline } = request.body;
    const toDoIndex = user.todos.findIndex((todoItem) => todoItem.id === id);

    const todo = user.todos[toDoIndex];

    user.todos[toDoIndex] = { ...todo, title, deadline: new Date(deadline) };

    return response.status(200).send(user.todos[toDoIndex]);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsToDo,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;
    const toDoIndex = user.todos.findIndex((todoItem) => todoItem.id === id);
    const todo = user.todos[toDoIndex];

    user.todos[toDoIndex] = { ...todo, done: true };

    return response.status(200).send({ ...todo, done: true });
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsToDo,
  (request, response) => {
    const { user } = request;
    const { id } = request.params;
    const toDoIndex = user.todos.findIndex((todoItem) => todoItem.id === id);

    user.todos.splice(toDoIndex, 1);

    response.status(204).send();
  }
);

module.exports = app;
