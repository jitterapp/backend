const AWS = require('aws-sdk');

//AWS S3 for Images
const { AWS_ACCESS_KEY_SECRET, AWS_ACCESS_KEY_ID, BUCKET_NAME } = process.env;
const s3Handle = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_ACCESS_KEY_SECRET,
});
const params = {
  Bucket: BUCKET_NAME,
  CreateBucketConfiguration: {
    // Set your region here
    LocationConstraint: 'eu-west-1',
  },
  ACL: 'public-read',
};

const createBucket = (options = params) => {
  s3Handle.createBucket(options, function (err, data) {
    if (err) console.log(err, err.stack);
    else console.log('Bucket Created Successfully', data.Location);
  });
};

const putPublicS3 = async function (key, data) {
  const response = await s3Handle.upload({ ACL: 'public-read', Body: data, Bucket: BUCKET_NAME, Key: key }).promise();

  return response.Location;
};

const deleteS3 = async function (key) {
  const response = await s3Handle.deleteObject({ Key: key, Bucket: BUCKET_NAME }).promise();

  return response.Location;
};

const downloadFromS3 = async function (key) {
  const response = await s3Handle.getObject({ Bucket: BUCKET_NAME, Key: key }).promise();
  return response.Body;
};

const listBucket = (bucket = BUCKET_NAME) => {
  s3Handle.listObjects({ Bucket: bucket }, function (err, data) {
    if (err) {
      console.log('Error', err);
      createBucket();
    } else {
      console.log('Success', data);
    }
  });
};

module.exports = {
  createBucket,
  putPublicS3,
  deleteS3,
  downloadFromS3,
  listBucket,
};
