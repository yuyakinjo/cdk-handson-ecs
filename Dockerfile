FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

COPY . .

RUN bun install

CMD [ "bun", "--watch", "run" , "index.ts" ]