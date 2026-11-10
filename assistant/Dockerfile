# The assistant service. Built from the repository root (it reads the site's
# data and blog posts): docker build -f assistant/Dockerfile .
# Node runs the TypeScript directly, so there is no build step.

FROM node:24-alpine
WORKDIR /app/assistant
COPY assistant/package.json assistant/package-lock.json ./
RUN npm ci --omit=dev
COPY assistant/src ./src
COPY assistant/faq.md ./
COPY src/data/site.ts src/data/services.ts src/data/works.ts /app/src/data/
COPY src/content/blog /app/src/content/blog
ENV NODE_ENV=production PORT=8080
USER node
EXPOSE 8080
CMD ["node", "src/server.ts"]
