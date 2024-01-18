const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const bucketName = "toktok-aws";

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadImageToS3 = async (buffer) => {
  console.log("truc", buffer);
  console.log("truc2", buffer.originalname);
  const ext = buffer.originalname.split(".").pop();
  const fileName = uuidv4() + "." + ext;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: fileName,
      Body: buffer.buffer,
      ContentType: `image/${ext}`,
      ACL: "public-read",
    })
  );

  return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
};

module.exports = { uploadImageToS3 };
