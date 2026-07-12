import { Router } from "express";

import { authRouter } from "./auth.js";
import { citationsRouter } from "./citations.js";
import { healthRouter } from "./health.js";
import { profileRouter } from "./profile.js";
import { savedRouter } from "./saved.js";
import { widgetRouter } from "./widget.js";

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use(citationsRouter);
apiRouter.use(savedRouter);
apiRouter.use(widgetRouter);
apiRouter.use(profileRouter);
