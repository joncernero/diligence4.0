import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth";
import { usersRouter } from "./routes/users";
import { projectsRouter } from "./routes/projects";
import { propertiesRouter } from "./routes/properties";
import { buildingsRouter } from "./routes/buildings";
import { walksRouter } from "./routes/walks";
import { observationsRouter } from "./routes/observations";
import { unitTypesRouter } from "./routes/unitTypes";
import { scopeRouter } from "./routes/scope";
import { csiCodesRouter } from "./routes/csiCodes";
import { tasksRouter } from "./routes/tasks";
import { documentsRouter } from "./routes/documents";
import { notificationsRouter } from "./routes/notifications";
import { residentsRouter } from "./routes/residents";
import { bulletinsRouter } from "./routes/bulletins";
import { pushRouter } from "./routes/push";
import { workSchedulesRouter } from "./routes/workSchedules";
import { approvalsRouter } from "./routes/approvals";
import { maintenanceRouter } from "./routes/maintenance";
import { validateEnvironmentVariables } from "./environment";
import { corsOptions } from "./middleware/cors";
import healthRouter from "./routes/health-check";

async function main(): Promise<void> {
  try {
    validateEnvironmentVariables();

    const app = express();

    // Middleware
    app.use(cors(corsOptions));
    app.use(express.json());

    // Routes
    app.use("/api/auth", authRouter);
    app.use("/api/users", usersRouter);
    app.use("/api/projects", projectsRouter);
    app.use("/api/buildings", buildingsRouter);
    app.use("/api/properties", propertiesRouter);
    app.use("/api/walks", walksRouter);
    app.use("/api/observations", observationsRouter);
    app.use("/api/unit-types", unitTypesRouter);
    app.use("/api/scope", scopeRouter);
    app.use("/api/csi-codes", csiCodesRouter);
    app.use("/api/tasks", tasksRouter);
    app.use("/api/documents", documentsRouter);
    app.use("/api/notifications", notificationsRouter);
    app.use("/api/residents", residentsRouter);
    app.use("/api/bulletins", bulletinsRouter);
    app.use("/api/push", pushRouter);
    app.use("/api/work-schedules", workSchedulesRouter);
    app.use("/api/approvals", approvalsRouter);
    app.use("/api/maintenance", maintenanceRouter);
    app.use("/api/health", healthRouter);

    // 404 handler
    app.use((_req, res) => {
      res.status(404).json({ error: "Route not found" });
    });

    // Error handler
    app.use(
      (
        err: any,
        _req: express.Request,
        res: express.Response,
        _next: express.NextFunction,
      ) => {
        console.error("Error:", err);
        res.status(500).json({
          error: "Internal server error",
          message:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        });
      },
    );

    // Start server
    app.listen(process.env.PORT, () => console.info(`🚀 server started`));
  } catch (err) {
    console.error(err);
  }
}

main();
