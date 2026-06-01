// @ts-nocheck
import { z } from 'zod';

enum RoomType {
  LECTURE_HALL = 'LECTURE_HALL',
  SEMINAR_ROOM = 'SEMINAR_ROOM',
  COMPUTER_LAB = 'COMPUTER_LAB',
  CHEMISTRY_LAB = 'CHEMISTRY_LAB',
  PHYSICS_LAB = 'PHYSICS_LAB',
  CONFERENCE_HALL = 'CONFERENCE_HALL',
  ACTIVE_LEARNING = 'ACTIVE_LEARNING',
  HYBRID = 'HYBRID',
}

export const roomSchema = z.object({
  code: z.string().min(1),
  number: z.string().min(1),
  capacity: z.number().int().positive(),
  building: z.string().min(1),
  buildingNo: z.number().int().optional(),
  roomType: z.nativeEnum(RoomType),
  description: z.string().optional(),
  isAvailable: z.boolean().default(true),
  departmentId: z.string().optional(),
});

export const updateRoomSchema = roomSchema.partial();
