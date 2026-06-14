import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 300000,
});

export async function uploadForSearchableDoc(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/api/searchable-doc", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      const pct = Math.round((event.loaded * 100) / event.total);
    },
  });

  return data;
}
