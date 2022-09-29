# Speculator

> 2022 iThome 鐵人賽《[從 Node.js 開發者到量化交易者：打造屬於自己的投資系統](https://ithelp.ithome.com.tw/users/20150150/ironman/5145)》範例程式

## Installation

```bash
$ npm install
```

Copy or rename `.env.example` to `.env` and set the values for your environment.

## Running the app

```bash
# development
$ npm run start [app]

# watch mode
$ npm run start:dev [app]

# production mode
$ npm run start:prod [app]
```

## Running with Docker

Make sure you have [docker](https://docs.docker.com/engine/installation/) and [docker-compose](https://docs.docker.com/compose/install/) installed.

### Starting services

```bash
$ docker-compose up -d
```

### Stoping services

```bash
$ docker-compose down
```

## License

[MIT licensed](LICENSE).
