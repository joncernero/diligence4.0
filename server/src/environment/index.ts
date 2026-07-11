import { cleanEnv, port, str } from "envalid";

export function validateEnvironmentVariables(): void {
  cleanEnv(process.env, {
    DATABASE_URL: str(),
    PORT: port(),
    NODE_ENV: str(),
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str(),
    FRONTEND_URL: str(),
    R2_ENDPOINT: str(),
    R2_ACCESS_KEY_ID: str(),
    R2_SECRET_ACCESS_KEY: str(),
    R2_BUCKET_NAME: str(),
    R2_PUBLIC_URL: str(),
    RESEND_API_KEY: str(),
    EMAIL_FROM: str(),
    VAPID_PUBLIC_KEY: str(),
    VAPID_PRIVATE_KEY: str(),
    VAPID_EMAIL: str(),
  });
}
