import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import calendarRouter from "./calendar";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(usersRouter);
router.use(calendarRouter);
router.use(dashboardRouter);

export default router;
