import { Request, Response, NextFunction } from 'express';
import * as usersService from './users.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/ApiResponse';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = { ...(req.query as Record<string, unknown>) };
    const { users, meta } = await usersService.getUsers(query);
    sendSuccess(res, users, 'Users retrieved', 200, meta);
  } catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.getUserById(req.params['id'] as string);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.createUser(req.body, req.user?.email);
    sendCreated(res, user, 'User created successfully');
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await usersService.updateUser(req.params['id'] as string, req.body);
    sendSuccess(res, user, 'User updated successfully');
  } catch (err) { next(err); }
}

export async function relatedCounts(req: Request, res: Response, next: NextFunction) {
  try {
    const counts = await usersService.getUserRelatedCounts(req.params['id'] as string);
    sendSuccess(res, counts);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const force = req.query['force'] === 'true';
    await usersService.deleteUser(req.params['id'] as string, force);
    sendNoContent(res);
  } catch (err) { next(err); }
}
