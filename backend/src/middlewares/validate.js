export const validateCreateBug = (req, res, next) => {
  const { errorType } = req.body;

  if (!errorType) {
    return res.status(400).json({ message: "errorType is required" });
  }

  next();
};

export const validateProgress = (req, res, next) => {
  const { nodeId, answer } = req.body;

  if (!nodeId || !answer) {
    return res
      .status(400)
      .json({ message: "nodeId and answer are required" });
  }

  next();
};

export const validateResolution = (req, res, next) => {
  const { resolutionId } = req.body;

  if (!resolutionId) {
    return res
      .status(400)
      .json({ message: "resolutionId is required" });
  }

  next();
};
