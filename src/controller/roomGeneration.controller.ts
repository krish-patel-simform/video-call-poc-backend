import type { Request, Response } from 'express';

export function createRoomId(req: Request, res: Response) {
  const roomId = Math.random().toString(36).substring(2, 8);

  return res.status(201).json({ message: 'Room Id is created', roomId });
}
