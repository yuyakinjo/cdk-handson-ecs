FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

COPY . .

RUN apt-get update && apt-get install wget -y

RUN bun install

CMD [ "bun", "--watch", "run" , "index.ts" ]