import { z } from 'zod';

export const IdSchema = z.string().uuid();

export { z };
