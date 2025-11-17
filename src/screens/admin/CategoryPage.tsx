import { useEffect, useState } from "react";
import { api } from "../../api/userapi/client"; // wrapper fetch/axios
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string | null;
  image?: string;
}

export function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      const res = await api<Category[]>("/categories");
      setCategories(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingId) {
        await api(`/categories/${editingId}`, {
          method: "PUT",
          body: JSON.stringify({ name, slug, image }),
        });
      } else {
        await api("/categories", {
          method: "POST",
          body: JSON.stringify({ name, slug, image }),
        });
      }
      setName("");
      setSlug("");
      setImage("");
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = (cat: Category) => {
    setName(cat.name);
    setSlug(cat.slug);
    setImage(cat.image || "");
    setEditingId(cat.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa category này?")) return;
    try {
      await api(`/categories/${id}`, { method: "DELETE" });
      fetchCategories();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Quản lý Category</h1>

      <div className="flex flex-col gap-2 mb-6">
        <input
          type="text"
          placeholder="Tên category"
          className="border p-2 rounded"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Slug"
          className="border p-2 rounded"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
        <input
          type="text"
          placeholder="URL hình"
          className="border p-2 rounded"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={handleSubmit}
        >
          {editingId ? "Cập nhật" : "Thêm mới"}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Tên</th>
            <th className="border p-2">Slug</th>
            <th className="border p-2">Hình</th>
            <th className="border p-2">Hành động</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-gray-50">
              <td className="border p-2">{cat.name}</td>
              <td className="border p-2">{cat.slug}</td>
              <td className="border p-2">
                {cat.image && (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
              </td>
              <td className="border p-2 flex gap-2">
                <button
                  className="bg-yellow-400 px-2 py-1 rounded hover:bg-yellow-500"
                  onClick={() => handleEdit(cat)}
                >
                  Sửa
                </button>
                <button
                  className="bg-red-500 px-2 py-1 rounded text-white hover:bg-red-600"
                  onClick={() => handleDelete(cat.id)}
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
