const mongoose = require('mongoose');

beforeAll(async () => {
  const uri = process.env.MONGO_URI || 'mongodb://bosorio020:coco258@ac-eoudjec-shard-00-00.xrrjvyr.mongodb.net:27017,ac-eoudjec-shard-00-01.xrrjvyr.mongodb.net:27017,ac-eoudjec-shard-00-02.xrrjvyr.mongodb.net:27017/?ssl=true&replicaSet=atlas-flez0h-shard-0&authSource=admin&appName=STREAMER';

  await mongoose.connect(uri);
}, 30000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({}))
  );
});