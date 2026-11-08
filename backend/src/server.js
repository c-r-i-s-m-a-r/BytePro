const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    app.listen(env.port, () => {
      // eslint-disable-next-line no-console
      console.log(`[bytepro] API escuchando en http://localhost:${env.port}/api`);
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[bytepro] no se pudo iniciar el servidor', err);
    process.exitCode = 1;
  }
}

start();
