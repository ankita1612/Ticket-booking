import express from "express";
import { listEvent, createEvent ,purchase, availability} from '../controllers/events/event.js'

const router = express.Router();

router.get('/', listEvent);
router.post('/', createEvent);
router.post('/:id/purchase', purchase);
router.get('/:id/availability', availability)

export default router;
