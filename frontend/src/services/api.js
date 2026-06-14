import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 300000,
});

export async function uploadForSearchableDoc(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await apiClient.post("/api/searchable-doc", formData);

  return data;
}
