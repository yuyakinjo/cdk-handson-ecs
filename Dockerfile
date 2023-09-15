FROM oven/bun

EXPOSE 3000

WORKDIR /usr/src

RUN apt-get update && apt-get install wget -y

COPY . .

RUN bun install
