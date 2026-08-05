import express from 'express';
import { createRoomId } from '../controller/roomGeneration.controller.js';
const roomGeneratorRouter = express.Router();

roomGeneratorRouter.route('/create-room-id').get(createRoomId);

export default roomGeneratorRouter;
