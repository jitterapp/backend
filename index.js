const app = require('./src/app');
const { listBucket } = require('./src/shared/aws');

listBucket();

app.listen(process.env.PORT || 3000, () => console.log('app is running'));
