FROM node:16 as builder

ENV NODE_ENV build

USER node
WORKDIR /home/node

COPY --chown=node:node . /home/node

RUN npm install \
    && npm run build trader

# ---

FROM node:16

ENV NODE_ENV production
ENV TZ Asia/Taipei

RUN apt-get update -y \
  && apt-get install libsecret-1-dev -y

USER node
WORKDIR /home/node

COPY --from=builder /home/node/package.json /home/node/
COPY --from=builder /home/node/package-lock.json /home/node/
COPY --from=builder /home/node/dist/ /home/node/dist/

RUN npm install --production

CMD ["node", "dist/apps/trader/main.js"]
