export const validateErrorDefinition = (data) => {
  if (!data.errorId || !data.name) return false;
  if (!data.startNode) return false;
  if (!data.nodes || typeof data.nodes !== "object")
    return false;
  if (!data.resolutions) return false;

  if (!data.nodes[data.startNode]) return false;

  return true;
};
