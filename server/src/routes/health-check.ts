import express, { Request, Response } from "express";

import { db } from "../db";
import { sql } from "drizzle-orm";

const healthRouter = express.Router();

healthRouter.get("/", async (_req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1 as "ping";`);

    res.status(200).send({ ok: true });
  } catch (error) {
    console.error(error);

    res.status(500).send({ ok: false });
  }
});

export default healthRouter;
