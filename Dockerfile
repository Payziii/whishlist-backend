# Dockerfile

FROM public.ecr.aws/docker/library/node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["node", "app.js"]