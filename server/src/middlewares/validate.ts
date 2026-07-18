import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export const validate = (schema: ZodType): RequestHandler => (req, _res, next) => {
  try {
    const parsed = schema.parse({ body: req.body, params: req.params, query: req.query }) as {
      body?: unknown;
      params?: Record<string, string>;
    };
    if (parsed.body !== undefined) req.body = parsed.body;
    if (parsed.params) Object.assign(req.params, parsed.params);
    next();
  } catch (error) { next(error); }
};
