const app = require('./src/app');
const sequelize = require('./src/config/database');
const AWS = require('aws-sdk');

//AWS S3 for Images
const ID = 'AKIAYWNBS2CVBBQCUMV2';
const SECRET = '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';
const BUCKET_NAME = 'jitter';
const s3 = new AWS.S3({
  accessKeyId: ID,
  secretAccessKey: SECRET,
});
const params = {
  Bucket: BUCKET_NAME,
  CreateBucketConfiguration: {
    // Set your region here
    LocationConstraint: 'eu-west-1',
  },
};

s3.createBucket(params, function (err, data) {
  if (err) console.log(err, err.stack);
  else console.log('Bucket Created Successfully', data.Location);
});

sequelize.sync();

app.listen(process.env.PORT || 3000, () => console.log('app is running'));
