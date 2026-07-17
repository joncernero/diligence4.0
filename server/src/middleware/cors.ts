const whitelist = [String(process.env.FRONTEND_URL)];

export const corsOptions = {
  origin: whitelist,
  credentials: true,
};
