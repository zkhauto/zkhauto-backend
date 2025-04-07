import { Storage } from "@google-cloud/storage";

const storage = new Storage({
  projectId: process.env.GOOGLE_STORAGE_PROJECT_ID,
  credentials: {
    type: process.env.GOOGLE_STORAGE_TYPE,
    project_id: process.env.GOOGLE_STORAGE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_STORAGE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_STORAGE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_STORAGE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_STORAGE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_STORAGE_AUTH_URI,
    token_uri: process.env.GOOGLE_STORAGE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.GOOGLE_STORAGE_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_STORAGE_CLIENT_X509_CERT_URL,
    universe_domain: process.env.GOOGLE_STORAGE_UNIVERSE_DOMAIN,
  },
});

// You'll need to replace 'YOUR_BUCKET_NAME' with your actual bucket name
const bucket = storage.bucket("zkhauto");

export { bucket };
