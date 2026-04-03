import { MongoClient } from "mongodb";

import { getMongoUri } from "@/lib/env";

const uri = getMongoUri();
const options = {};

declare global {
  // eslint-disable-next-line no-var
  var mongoClientPromise: Promise<MongoClient> | undefined;
}

const client = new MongoClient(uri, options);
const clientPromise = global.mongoClientPromise ?? client.connect();

global.mongoClientPromise = clientPromise;

export default clientPromise;
