import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Set test database URI if not set
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/movie-app-test';
}

// Set JWT secret if not set
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-secret-key';
}

// Set AWS credentials for testing
if (!process.env.AWS_ACCESS_KEY_ID) {
  process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
}
if (!process.env.AWS_SECRET_ACCESS_KEY) {
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
}
if (!process.env.AWS_REGION) {
  process.env.AWS_REGION = 'us-east-1';
}
if (!process.env.AWS_BUCKET_NAME) {
  process.env.AWS_BUCKET_NAME = 'test-bucket';
} 