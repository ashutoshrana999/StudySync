function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      });
      req.validated = parsed;
      next();
    } catch (err) {
      res.status(400);
      next(err);
    }
  };
}

module.exports = { validate };

