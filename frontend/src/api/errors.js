import api from "./axios";

export const getErrors = () => api.get("/errors").then((res) => res.data);

export const getErrorById = (id) =>
  api.get(`/errors/${id}`).then((res) => res.data);

export const deleteError = async (errorId) => {
  const res = await fetch(`http://localhost:8000/api/errors/${errorId}`, {
    method: "DELETE",
    headers: {
      "x-admin-key": "super-secret-admin-key",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to delete error");
  }

  return res.json();
};
