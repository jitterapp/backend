const app = require('./src/app');
const sequelize = require('./src/config/database');
const { listBucket } = require('./src/shared/aws');

listBucket();

sequelize.sync();

app.listen(process.env.PORT || 3000, () => console.log('app is running'));
