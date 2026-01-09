export const adminOnly = (req, res, next) => {
  const adminKey = req.headers["x-admin-key"];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      message: "Admin access required"
    });
  }

  next();
};
