import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";

const emptyVariant = {
  flavor: "",
  weight: "",
  price: "",
  discountPrice: "",
  stock: "",
  sku: "",
  servings: "",
  supplyLabel: "",
  flavorImage: "",
  flavorPriceAdjustment: "",
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  category: "",
  productType: "",
  sections: [],
  variants: [{ ...emptyVariant }],
  images: [],
  ingredients: "",
  directionsOfUse: "",
  whoIsThisFor: "",
  posterTop: "",
  posterBottom: "",
};

export default function AdminProducts() {
  const { token, user } = useAuth();
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [catForm, setCatForm] = useState({ name: "", slug: "" });

  const [form, setForm] = useState(emptyForm);
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const loadData = () => {
    api.adminGetCategories(token).then((d) => setCategories(d.data)).catch(() => {});
    api.adminGetProducts(token).then((d) => setProducts(d.data)).catch(() => {});
  };

  useEffect(() => {
    if (token) loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (user && !["admin", "superadmin"].includes(user.role)) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-red-400">Admin access only.</p>;
  }

  const handleCatChange = (e) => setCatForm({ ...catForm, [e.target.name]: e.target.value });
  const handleFormChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleSection = (value) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(value)
        ? f.sections.filter((s) => s !== value)
        : [...f.sections, value],
    }));
  };

  /* ---------- Variant helpers ---------- */
  const handleVariantChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const variants = [...f.variants];
      variants[index] = { ...variants[index], [name]: value };
      return { ...f, variants };
    });
  };

  const addVariant = () => {
    setForm((f) => ({ ...f, variants: [...f.variants, { ...emptyVariant }] }));
  };

  const removeVariant = (index) => {
    setForm((f) => ({
      ...f,
      variants: f.variants.length > 1 ? f.variants.filter((_, i) => i !== index) : f.variants,
    }));
  };

  // ---------- Cloudinary image upload ----------
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // instant local preview jab tak upload chal raha hai
    setThumbnailPreview(URL.createObjectURL(file));

    try {
      setUploading(true);
      const { url } = await api.uploadImage(token, file);
      setThumbnailUrl(url); // Cloudinary ka secure URL, DB me yahi store hoga
    } catch (err) {
      toastError("Image upload failed: " + err.message);
      setThumbnailPreview("");
      setThumbnailUrl("");
    } finally {
      setUploading(false);
    }
  };

  // Gallery images shown in the PDP swipeable carousel — multi-file, uploads
  // each to Cloudinary and appends the URL.
  const handleGalleryUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const uploaded = await Promise.all(files.map((f) => api.uploadImage(token, f)));
      setForm((f) => ({ ...f, images: [...f.images, ...uploaded.map((u) => u.url)] }));
    } catch (err) {
      toastError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  // Per-variant flavor swatch photo — reuse the same image across every
  // weight of the same flavor rather than re-uploading it each time.
  const handleVariantImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await api.uploadImage(token, file);
      setForm((f) => {
        const variants = [...f.variants];
        variants[index] = { ...variants[index], flavorImage: url };
        return { ...f, variants };
      });
    } catch (err) {
      toastError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // PDP bottom promo posters (posterTop / posterBottom) — single image each.
  const handlePosterUpload = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await api.uploadImage(token, file);
      setForm((f) => ({ ...f, [field]: url }));
    } catch (err) {
      toastError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await api.adminCreateCategory(token, catForm);
      setMessage("Category created.");
      success("Category created successfully.");
      setCatForm({ name: "", slug: "" });
      loadData();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setThumbnailUrl("");
    setThumbnailPreview("");
    setEditingId(null);
  };

  const startEdit = (product) => {
    const variants = product.variants?.length
      ? product.variants.map((v) => ({
          flavor: v.flavor || "",
          weight: v.weight || "",
          price: v.price ?? "",
          discountPrice: v.discountPrice ?? "",
          stock: v.stock ?? "",
          sku: v.sku || "",
          servings: v.servings ?? "",
          supplyLabel: v.supplyLabel || "",
          flavorImage: v.flavorImage || "",
          flavorPriceAdjustment: v.flavorPriceAdjustment ?? "",
        }))
      : [{ ...emptyVariant }];

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      brand: product.brand || "",
      category: product.category?._id || product.category || "",
      productType: product.productType || "",
      sections: product.sections || [],
      variants,
      images: product.images || [],
      ingredients: product.ingredients || "",
      directionsOfUse: product.directionsOfUse || "",
      whoIsThisFor: product.whoIsThisFor || "",
      posterTop: product.posterTop || "",
      posterBottom: product.posterBottom || "",
    });
    setThumbnailUrl(product.thumbnail || "");
    setThumbnailPreview(product.thumbnail || "");
    setEditingId(product._id);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const buildPayload = () => ({
    name: form.name,
    slug: form.slug,
    description: form.description,
    brand: form.brand,
    category: form.category,
    productType: form.productType,
    thumbnail: thumbnailUrl, // ab Cloudinary URL jayega, base64 nahi
    images: form.images,
    ingredients: form.ingredients,
    directionsOfUse: form.directionsOfUse,
    whoIsThisFor: form.whoIsThisFor,
    posterTop: form.posterTop,
    posterBottom: form.posterBottom,
    sections: form.sections,
    variants: form.variants.map((v) => ({
      flavor: v.flavor,
      weight: v.weight,
      price: Number(v.price),
      discountPrice: v.discountPrice ? Number(v.discountPrice) : undefined,
      stock: Number(v.stock),
      sku: v.sku,
      servings: v.servings ? Number(v.servings) : undefined,
      supplyLabel: v.supplyLabel,
      flavorImage: v.flavorImage,
      flavorPriceAdjustment: v.flavorPriceAdjustment ? Number(v.flavorPriceAdjustment) : 0,
    })),
  });

  const validateVariants = () => {
    for (const v of form.variants) {
      if (!v.weight || v.price === "" || v.stock === "" || !v.sku) {
        return false;
      }
    }
    const skus = form.variants.map((v) => v.sku.trim().toLowerCase());
    if (new Set(skus).size !== skus.length) return "duplicate";
    return true;
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!thumbnailUrl) {
      setError("Please choose a thumbnail image.");
      toastError("Please choose a thumbnail image.");
      return;
    }

    const variantsValid = validateVariants();
    if (variantsValid === "duplicate") {
      setError("Each variant needs a unique SKU.");
      toastError("Each variant needs a unique SKU.");
      return;
    }
    if (!variantsValid) {
      setError("Please fill in weight, price, stock, and SKU for every variant.");
      toastError("Please fill in weight, price, stock, and SKU for every variant.");
      return;
    }

    try {
      if (editingId) {
        await api.adminUpdateProduct(token, editingId, buildPayload());
        setMessage("Product updated.");
        success("Product updated successfully.");
      } else {
        await api.adminCreateProduct(token, buildPayload());
        setMessage("Product created.");
        success("Product created successfully.");
      }
      resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Deactivate this product? It will no longer show in the storefront.")) return;
    setError("");
    setMessage("");
    try {
      await api.adminDeleteProduct(token, id);
      setMessage("Product deactivated.");
      success("Product deactivated.");
      if (editingId === id) resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-mdn-green sm:text-left">
        Admin Panel
      </p>
      <h2 className="mt-1 text-center text-2xl font-bold text-mdn-white sm:text-left sm:text-3xl">Products</h2>

      {error && <p className="mt-4 text-center text-sm text-red-400 sm:text-left">{error}</p>}
      {message && <p className="mt-4 text-center text-sm text-mdn-green sm:text-left">{message}</p>}

      {/* Create Category */}
      <div className="card mt-8 p-6">
        <h3 className="text-lg font-bold text-mdn-white">Create Category</h3>
        <form onSubmit={handleCreateCategory} className="mt-4 grid gap-4 sm:grid-cols-2">
          <input
            name="name"
            placeholder="Category name"
            value={catForm.name}
            onChange={handleCatChange}
            required
            className="input-field"
          />
          <input
            name="slug"
            placeholder="Slug (e.g. protein)"
            value={catForm.slug}
            onChange={handleCatChange}
            required
            className="input-field"
          />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Create Category
            </button>
          </div>
        </form>
      </div>

      {/* Create / Edit Product */}
      <div className="card mt-8 p-6">
        <h3 className="text-lg font-bold text-mdn-white">{editingId ? "Edit Product" : "Create Product"}</h3>
        <form onSubmit={handleSubmitProduct} className="mt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input name="name" placeholder="Product name" value={form.name} onChange={handleFormChange} required className="input-field" />
            <input name="slug" placeholder="Slug (e.g. gold-whey-protein)" value={form.slug} onChange={handleFormChange} required className="input-field" />
          </div>

          <textarea
            name="description"
            placeholder="Description"
            value={form.description}
            onChange={handleFormChange}
            required
            rows={4}
            className="input-field w-full resize-y"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <input name="brand" placeholder="Brand" value={form.brand} onChange={handleFormChange} required className="input-field" />
            <select name="category" value={form.category} onChange={handleFormChange} required className="input-field">
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <input
            name="productType"
            placeholder="Product type (e.g. Whey Protein)"
            value={form.productType}
            onChange={handleFormChange}
            required
            className="input-field w-full"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Thumbnail image</label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <input type="file" accept="image/*" onChange={handleImageChange} className="input-field w-full sm:w-auto" />
              {thumbnailPreview && (
                <div className="relative h-20 w-20 shrink-0">
                  <img
                    src={thumbnailPreview}
                    alt="preview"
                    className="h-20 w-20 rounded-lg border border-white/10 object-cover"
                  />
                  {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-[10px] text-white">
                      Uploading...
                    </div>
                  )}
                </div>
              )}
            </div>
            {uploading && <p className="mt-1 text-xs text-mdn-gray">Uploading to Cloudinary…</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">
              Gallery images <span className="text-mdn-gray">(shown as a swipeable carousel on the product page)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleGalleryUpload}
              className="input-field w-full sm:w-auto"
            />
            {form.images.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {form.images.map((url, i) => (
                  <div key={i} className="relative h-20 w-20 shrink-0">
                    <img src={url} alt={`Gallery ${i + 1}`} className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(i)}
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Top poster</label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <input type="file" accept="image/*" onChange={(e) => handlePosterUpload("posterTop", e)} className="input-field w-full sm:w-auto" />
              {form.posterTop && <img src={form.posterTop} alt="Top poster preview" className="h-16 w-28 rounded-lg border border-white/10 object-cover" />}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Bottom poster</label>
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <input type="file" accept="image/*" onChange={(e) => handlePosterUpload("posterBottom", e)} className="input-field w-full sm:w-auto" />
              {form.posterBottom && <img src={form.posterBottom} alt="Bottom poster preview" className="h-16 w-28 rounded-lg border border-white/10 object-cover" />}
            </div>
          </div>

          <textarea
            name="ingredients"
            placeholder="Ingredients (optional)"
            value={form.ingredients}
            onChange={handleFormChange}
            rows={3}
            className="input-field w-full resize-y"
          />

          <textarea
            name="directionsOfUse"
            placeholder="How to use? (optional)"
            value={form.directionsOfUse}
            onChange={handleFormChange}
            rows={3}
            className="input-field w-full resize-y"
          />

          <textarea
            name="whoIsThisFor"
            placeholder="Who is this for? (optional)"
            value={form.whoIsThisFor}
            onChange={handleFormChange}
            rows={3}
            className="input-field w-full resize-y"
          />

          {/* ---------- Variants ---------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-mdn-white">
                Variants <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-mdn-gray">
                {form.variants.length} variant{form.variants.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mdn-gray/70">
              Add one entry per flavor/weight/price combo customers can choose from (e.g. "Orange Burst — 390g" and
              "Chocolate — 1kg").
            </p>

            <div className="mt-3 space-y-4">
              {form.variants.map((v, i) => (
                <div key={i} className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-mdn-gray">
                      Variant {i + 1}
                    </span>
                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(i)}
                        className="text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <input
                      name="flavor"
                      placeholder="Flavor (optional)"
                      value={v.flavor}
                      onChange={(e) => handleVariantChange(i, e)}
                      className="input-field"
                    />
                    <input
                      name="weight"
                      placeholder="Weight (e.g. 1kg)"
                      value={v.weight}
                      onChange={(e) => handleVariantChange(i, e)}
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <input
                      name="price"
                      type="number"
                      placeholder="Price"
                      value={v.price}
                      onChange={(e) => handleVariantChange(i, e)}
                      required
                      className="input-field"
                    />
                    <input
                      name="discountPrice"
                      type="number"
                      placeholder="Discount price (optional)"
                      value={v.discountPrice}
                      onChange={(e) => handleVariantChange(i, e)}
                      className="input-field"
                    />
                    <input
                      name="stock"
                      type="number"
                      placeholder="Stock (admin only)"
                      value={v.stock}
                      onChange={(e) => handleVariantChange(i, e)}
                      required
                      className="input-field"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs text-mdn-gray">
                      Price increase for this flavor (optional) — added on top of the price above, e.g. price 500
                      + 50 here = 550 charged when a customer picks this flavor
                    </label>
                    <input
                      name="flavorPriceAdjustment"
                      type="number"
                      placeholder="e.g. 50 (leave blank or 0 for no change)"
                      value={v.flavorPriceAdjustment}
                      onChange={(e) => handleVariantChange(i, e)}
                      className="input-field w-full sm:w-1/3"
                    />
                  </div>

                  <input
                    name="sku"
                    placeholder="SKU (unique code)"
                    value={v.sku}
                    onChange={(e) => handleVariantChange(i, e)}
                    required
                    className="input-field mt-4 w-full"
                  />

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      name="servings"
                      type="number"
                      placeholder="Servings (optional)"
                      value={v.servings}
                      onChange={(e) => handleVariantChange(i, e)}
                      className="input-field"
                    />
                    <input
                      name="supplyLabel"
                      placeholder="Supply label (e.g. 2-month supply)"
                      value={v.supplyLabel}
                      onChange={(e) => handleVariantChange(i, e)}
                      className="input-field"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs text-mdn-gray">
                      Flavor photo — reuse the same image across every weight of this flavor
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleVariantImageUpload(i, e)}
                        className="input-field w-full sm:w-auto"
                      />
                      {v.flavorImage && (
                        <img src={v.flavorImage} alt="Flavor preview" className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addVariant}
              className="btn-secondary mt-3 !px-4 !py-1.5 text-sm"
            >
              + Add Another Variant
            </button>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Show in sections</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-mdn-gray">
                <input
                  type="checkbox"
                  checked={form.sections.includes("best_seller")}
                  onChange={() => toggleSection("best_seller")}
                  className="h-4 w-4 accent-mdn-green"
                />
                Best Sellers
              </label>
              <label className="flex items-center gap-2 text-sm text-mdn-gray">
                <input
                  type="checkbox"
                  checked={form.sections.includes("new_arrival")}
                  onChange={() => toggleSection("new_arrival")}
                  className="h-4 w-4 accent-mdn-green"
                />
                New Arrivals
              </label>
              <label className="flex items-center gap-2 text-sm text-mdn-gray">
                <input
                  type="checkbox"
                  checked={form.sections.includes("fitness_combo")}
                  onChange={() => toggleSection("fitness_combo")}
                  className="h-4 w-4 accent-mdn-green"
                />
                Fitness Combos
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button type="submit" disabled={uploading} className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              {editingId ? "Save Changes" : "Create Product"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary w-full sm:w-auto" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Existing Products */}
      <div className="mt-8">
        <h3 className="text-lg font-bold text-mdn-white">Existing Products ({products.length})</h3>
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-mdn-charcoal2 text-left text-xs uppercase tracking-wide text-mdn-gray">
                <th className="px-4 py-3">Thumbnail</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Brand</th>
                <th className="px-4 py-3">Variants</th>
                <th className="px-4 py-3">Sections</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className={`border-b border-white/5 ${!p.isActive ? "opacity-50" : ""}`}>
                  <td className="px-4 py-3">
                    <img
                      src={p.thumbnail}
                      alt={p.name}
                      className="h-12 w-12 rounded-lg object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </td>
                  <td className="px-4 py-3 text-mdn-white">{p.name}</td>
                  <td className="px-4 py-3 text-mdn-gray">{p.brand}</td>
                  <td className="px-4 py-3 text-mdn-gray">
                    {p.variants?.length || 0} variant{(p.variants?.length || 0) === 1 ? "" : "s"}
                    {p.variants?.length > 0 && (
                      <span className="block text-xs text-mdn-gray/70">
                        Total stock: {p.variants.reduce((sum, v) => sum + (v.stock || 0), 0)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-mdn-gray">
                    {(p.sections || []).map((s) => s.replace("_", " ")).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3 text-mdn-gray">{p.isActive ? "Active" : "Inactive"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(p)} className="btn-secondary !px-3 !py-1 text-xs">
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-mdn-gray">
                    No products yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}