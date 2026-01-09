import api from "./axios";

export const createBug = (data) =>
  api.post("/bugs", data).then(res => res.data);

export const getBugs = () =>
  api.get("/bugs").then(res => res.data);

export const getBugById = (id) =>
  api.get(`/bugs/${id}`).then(res => res.data);

export const saveProgress = (bugId, data) =>
  api.post(`/bugs/${bugId}/progress`, data).then(res => res.data);

export const undoLastProgress = (bugId) =>
  api.post(`/bugs/${bugId}/undo`).then(res => res.data);

export const resolveBug = (bugId, data) =>
  api.post(`/bugs/${bugId}/resolve`, data).then(res => res.data);
