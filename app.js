import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import connectToMongo from "./config/mongo.js"

import giftsRoutes from "./routes/gifts.routes.js"
import authRoutes from "./routes/auth.routes.js"
import friendsRoutes from "./routes/friends.routes.js"
import imagesRoutes from "./routes/images.routes.js"
import usersRoutes from "./routes/users.routes.js"
import tagsRoutes from "./routes/tags.routes.js"
import eventsRoutes from "./routes/events.routes.js"
import notificationsRoutes from "./routes/notifications.routes.js"
import draftsRoutes from "./routes/drafts.routes.js"
import parsesRoutes from "./routes/parses.routes.js"
import thanksRoutes from "./routes/thanks.routes.js"
import otherRoutes from "./routes/other.routes.js"

import { initEventScheduler } from "./scheduler.js";
import { runBot } from "./bot.js";

dotenv.config()

const app=express()
app.set('etag', false);

const uploadLimit = process.env.MAX_UPLOAD_LIMIT || '5mb';

app.use(express.json({ limit: uploadLimit }));
app.use(express.urlencoded({ limit: uploadLimit, extended: true }));
app.use(cors())

app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'WhishList Backend API',
      version: '0.0.2',
      description: 'API for WhishList Telegram Mini App',
    },
  },
  apis: ['./routes/*.js'],
};
const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use("/gifts",giftsRoutes)
app.use("/auth",authRoutes)
app.use("/friends",friendsRoutes)
app.use("/images",imagesRoutes)
app.use("/users",usersRoutes)
app.use("/tags",tagsRoutes)
app.use("/events",eventsRoutes)
app.use("/notifications",notificationsRoutes)
app.use("/drafts",draftsRoutes)
app.use("/parses",parsesRoutes)
app.use("/thanks",thanksRoutes)
app.use("/other", otherRoutes)

app.listen(5000,()=>{
    connectToMongo()
    console.log("Server is started at http://localhost:5000")

    initEventScheduler();
    runBot();
})