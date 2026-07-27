import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../api/api";
import { useToast } from "../context/ToastContext";
// Imported from the storefront strip itself so the picker can only ever
// offer icon keys that actually render there.
import { BENEFIT_ICONS, BENEFIT_ICON_KEYS, MAX_BENEFITS } from "../components/ProductBenefits";
// Same source the product page labels these with, so the checkboxes can
// only offer values the storefront knows how to render.
import { GOAL_LABELS, DIET_LABELS } from "../components/ProductFacts";

// Fixed gallery slots — image #1 is always what customers see first in the
// product-page carousel AND doubles as the product's thumbnail (listing
// card photo), #2 second, etc. Simpler than a dynamic add/reorder list:
// each slot is its own upload button at a fixed spot.
const GALLERY_SLOT_LABELS = ["1st image (Front / Thumbnail)", "2nd image", "3rd image", "4th image", "5th image"];

const emptySize = {
  weight: "",
  price: "",
  discountPrice: "",
  stock: "",
  sku: "",
  servings: "",
  supplyLabel: "",
};

const emptyFlavor = {
  name: "",
  image: "",
  priceAdjustment: "",
};

const emptyHighlight = {
  label: "",
  value: "",
};

const emptyBenefit = {
  text: "",
  icon: "",
};

const emptyForm = {
  name: "",
  slug: "",
  description: "",
  brand: "",
  category: "",
  productType: "",
  tags: "",
  sections: [],
  goal: [],
  dietaryTags: [],
  sizes: [{ ...emptySize }],
  flavors: [],
  nutritionHighlights: [],
  benefits: [],
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
  const [catEditingId, setCatEditingId] = useState(null);
  const [catSaving, setCatSaving] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  // Which gallery slot (0-4) is currently uploading, for a per-slot spinner.
  const [uploadingSlot, setUploadingSlot] = useState(null);
  // { [sizeIndex]: { weight: true, price: true, ... } } — which size fields
  // failed validation, so the exact input can get a red border instead of
  // just a generic message at the top of the page.
  const [sizeErrors, setSizeErrors] = useState({});
  const [thumbnailMissing, setThumbnailMissing] = useState(false);

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

  const sizeFieldClass = (index, field) =>
    `input-field ${sizeErrors[index]?.[field] ? "!border-red-500/60 focus:!border-red-500 focus:!ring-red-500/25" : ""}`;

  const toggleSection = (value) => {
    setForm((f) => ({
      ...f,
      sections: f.sections.includes(value)
        ? f.sections.filter((s) => s !== value)
        : [...f.sections, value],
    }));
  };

  // Same toggle for any array-of-enum field on the form (goal,
  // dietaryTags) rather than a near-identical copy of the above per field.
  const toggleInArray = (field, value) => {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter((v) => v !== value)
        : [...f[field], value],
    }));
  };

  /* ---------- Size helpers (independent of flavor) ---------- */
  const handleSizeChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const sizes = [...f.sizes];
      sizes[index] = { ...sizes[index], [name]: value };
      return { ...f, sizes };
    });
    // Clear just this field's red border as soon as it's edited, rather
    // than making the admin re-submit before seeing it's fixed.
    setSizeErrors((prev) => {
      if (!prev[index]?.[name]) return prev;
      const rowErrors = { ...prev[index] };
      delete rowErrors[name];
      return { ...prev, [index]: rowErrors };
    });
  };

  const addSize = () => {
    setForm((f) => ({ ...f, sizes: [...f.sizes, { ...emptySize }] }));
  };

  const removeSize = (index) => {
    // Row indices shift after a removal, so any existing error highlights
    // would point at the wrong row — clear them rather than carry stale
    // ones forward.
    setSizeErrors({});
    setForm((f) => ({
      ...f,
      sizes: f.sizes.length > 1 ? f.sizes.filter((_, i) => i !== index) : f.sizes,
    }));
  };

  /* ---------- Flavor helpers (independent of size, optional) ---------- */
  const handleFlavorChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const flavors = [...f.flavors];
      flavors[index] = { ...flavors[index], [name]: value };
      return { ...f, flavors };
    });
  };

  const addFlavor = () => {
    setForm((f) => ({ ...f, flavors: [...f.flavors, { ...emptyFlavor }] }));
  };

  const removeFlavor = (index) => {
    setForm((f) => ({ ...f, flavors: f.flavors.filter((_, i) => i !== index) }));
  };

  /* ---------- Nutrition highlight helpers (PDP stat cards) ---------- */
  const handleHighlightChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const nutritionHighlights = [...f.nutritionHighlights];
      nutritionHighlights[index] = { ...nutritionHighlights[index], [name]: value };
      return { ...f, nutritionHighlights };
    });
  };

  const addHighlight = () => {
    setForm((f) => ({ ...f, nutritionHighlights: [...f.nutritionHighlights, { ...emptyHighlight }] }));
  };

  const removeHighlight = (index) => {
    setForm((f) => ({
      ...f,
      nutritionHighlights: f.nutritionHighlights.filter((_, i) => i !== index),
    }));
  };

  /* ---------- Benefit helpers (PDP icon + claim strip) ---------- */
  const handleBenefitChange = (index, e) => {
    const { name, value } = e.target;
    setForm((f) => {
      const benefits = [...f.benefits];
      benefits[index] = { ...benefits[index], [name]: value };
      return { ...f, benefits };
    });
  };

  const addBenefit = () => {
    setForm((f) =>
      f.benefits.length >= MAX_BENEFITS
        ? f
        : { ...f, benefits: [...f.benefits, { ...emptyBenefit }] }
    );
  };

  const removeBenefit = (index) => {
    setForm((f) => ({ ...f, benefits: f.benefits.filter((_, i) => i !== index) }));
  };

  // Gallery images — also doubles as the thumbnail source (slot 0 = the
  // product's thumbnail). Each of the 5 slots uploads straight into its
  // own fixed position in product.images.
  const handleGallerySlotUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      setUploadingSlot(index);
      const { url } = await api.uploadImage(token, file);
      setForm((f) => {
        const images = [...f.images];
        while (images.length <= index) images.push(""); // pad earlier empty slots
        images[index] = url;
        return { ...f, images };
      });
      if (index === 0) setThumbnailMissing(false);
    } catch (err) {
      toastError("Image upload failed: " + err.message);
    } finally {
      setUploading(false);
      setUploadingSlot(null);
      e.target.value = "";
    }
  };

  const removeGallerySlot = (index) => {
    setForm((f) => {
      const images = [...f.images];
      images[index] = "";
      return { ...f, images };
    });
  };

  // Flavor swatch photo — one per flavor now (not per size), since flavor
  // is independent of size.
  const handleFlavorImageUpload = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setUploading(true);
      const { url } = await api.uploadImage(token, file);
      setForm((f) => {
        const flavors = [...f.flavors];
        flavors[index] = { ...flavors[index], image: url };
        return { ...f, flavors };
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

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setCatSaving(true);
    try {
      if (catEditingId) {
        await api.adminUpdateCategory(token, catEditingId, catForm);
        setMessage("Category updated.");
        success("Category updated successfully.");
      } else {
        await api.adminCreateCategory(token, catForm);
        setMessage("Category created.");
        success("Category created successfully.");
      }
      setCatForm({ name: "", slug: "" });
      setCatEditingId(null);
      loadData();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    } finally {
      setCatSaving(false);
    }
  };

  const startEditCategory = (cat) => {
    setCatForm({ name: cat.name || "", slug: cat.slug || "" });
    setCatEditingId(cat._id);
  };

  const cancelEditCategory = () => {
    setCatForm({ name: "", slug: "" });
    setCatEditingId(null);
  };

  const handleToggleCategoryActive = async (cat) => {
    const action = cat.isActive ? "Deactivate" : "Reactivate";
    if (!window.confirm(`${action} the "${cat.name}" category?`)) return;
    try {
      if (cat.isActive) {
        await api.adminDeleteCategory(token, cat._id); // soft delete (sets isActive: false)
      } else {
        await api.adminUpdateCategory(token, cat._id, { isActive: true });
      }
      success(`Category ${cat.isActive ? "deactivated" : "reactivated"}.`);
      loadData();
    } catch (err) {
      toastError(err.message);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSizeErrors({});
    setThumbnailMissing(false);
  };

  const startEdit = (product) => {
    const sizes = product.sizes?.length
      ? product.sizes.map((s) => ({
          weight: s.weight || "",
          price: s.price ?? "",
          discountPrice: s.discountPrice ?? "",
          stock: s.stock ?? "",
          sku: s.sku || "",
          servings: s.servings ?? "",
          supplyLabel: s.supplyLabel || "",
        }))
      : [{ ...emptySize }];

    const flavors = (product.flavors || []).map((f) => ({
      name: f.name || "",
      image: f.image || "",
      priceAdjustment: f.priceAdjustment ?? "",
    }));

    // Older products were saved with a thumbnail uploaded separately from
    // the gallery, so it may not already be images[0] — put it there so
    // slot 1 shows what's actually the live thumbnail instead of silently
    // swapping it out the next time this product is saved.
    const galleryImages = product.images || [];
    const images =
      product.thumbnail && galleryImages[0] !== product.thumbnail
        ? [product.thumbnail, ...galleryImages.filter((img) => img !== product.thumbnail)]
        : galleryImages;

    setForm({
      name: product.name || "",
      slug: product.slug || "",
      description: product.description || "",
      brand: product.brand || "",
      category: product.category?._id || product.category || "",
      productType: product.productType || "",
      tags: (product.tags || []).join(", "),
      sections: product.sections || [],
      // Filtered to keys we can actually label — a legacy/seeded value
      // outside the enum would otherwise sit in state invisibly and get
      // written straight back on the next save.
      goal: (product.goal || []).filter((g) => GOAL_LABELS[g]),
      dietaryTags: (product.dietaryTags || []).filter((t) => DIET_LABELS[t]),
      sizes,
      flavors,
      nutritionHighlights: (product.nutritionHighlights || []).map((h) => ({
        label: h.label || "",
        value: h.value || "",
      })),
      benefits: (product.benefits || []).map((b) => ({ text: b.text || "", icon: b.icon || "" })),
      images,
      ingredients: product.ingredients || "",
      directionsOfUse: product.directionsOfUse || "",
      whoIsThisFor: product.whoIsThisFor || "",
      posterTop: product.posterTop || "",
      posterBottom: product.posterBottom || "",
    });
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
    tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
    thumbnail: form.images[0] || "", // slot 1 doubles as the thumbnail
    images: form.images.filter(Boolean), // drop empty slots, keep the fixed order
    ingredients: form.ingredients,
    directionsOfUse: form.directionsOfUse,
    whoIsThisFor: form.whoIsThisFor,
    // Both fields are required by the schema, so a row missing either one
    // is an unfinished blank row rather than a real stat — dropped instead
    // of failing the whole save with a validation error.
    nutritionHighlights: form.nutritionHighlights
      .filter((h) => h.label.trim() && h.value.trim())
      .map((h) => ({ label: h.label.trim(), value: h.value.trim() })),
    // Only `text` is required by the schema — a row with no text is an
    // unfinished blank, and a blank icon is fine (the strip cycles them).
    benefits: form.benefits
      .filter((b) => b.text.trim())
      .slice(0, MAX_BENEFITS)
      .map((b) => ({ text: b.text.trim(), icon: b.icon || undefined })),
    posterTop: form.posterTop,
    posterBottom: form.posterBottom,
    sections: form.sections,
    // Always sent, including when empty — that's what lets unticking every
    // box actually clear a product's tags. Omitting the key would leave
    // the old value untouched, since updateProduct patches with req.body.
    goal: form.goal,
    dietaryTags: form.dietaryTags,
    sizes: form.sizes.map((s) => ({
      weight: s.weight,
      price: Number(s.price),
      discountPrice: s.discountPrice ? Number(s.discountPrice) : undefined,
      stock: Number(s.stock),
      sku: s.sku,
      servings: s.servings ? Number(s.servings) : undefined,
      supplyLabel: s.supplyLabel,
    })),
    // Flavors are optional — a row left with no name is just an unused
    // blank row, not a real flavor, so it's dropped rather than saved.
    flavors: form.flavors
      .filter((f) => f.name.trim())
      .map((f) => ({
        name: f.name.trim(),
        image: f.image,
        priceAdjustment: f.priceAdjustment ? Number(f.priceAdjustment) : 0,
      })),
  });

  // Computes per-field errors (for red borders on the exact inputs at
  // fault) and returns an overall verdict: true (valid), "duplicate", or
  // false (missing required fields).
  const validateSizes = () => {
    const errors = {};
    form.sizes.forEach((s, i) => {
      const rowErrors = {};
      if (!s.weight) rowErrors.weight = true;
      if (s.price === "") rowErrors.price = true;
      if (s.stock === "") rowErrors.stock = true;
      if (!s.sku) rowErrors.sku = true;
      if (Object.keys(rowErrors).length) errors[i] = rowErrors;
    });

    // Duplicate SKUs — mark every row sharing the value, not just the 2nd+.
    const skuRows = {};
    form.sizes.forEach((s, i) => {
      const key = s.sku.trim().toLowerCase();
      if (!key) return;
      (skuRows[key] ||= []).push(i);
    });
    let hasDuplicates = false;
    Object.values(skuRows).forEach((indices) => {
      if (indices.length > 1) {
        hasDuplicates = true;
        indices.forEach((i) => {
          errors[i] = { ...errors[i], sku: true };
        });
      }
    });

    setSizeErrors(errors);
    if (hasDuplicates) return "duplicate";
    if (Object.keys(errors).length) return false;
    return true;
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    setThumbnailMissing(!form.images[0]);
    if (!form.images[0]) {
      setError("Please upload the 1st image (it's used as the thumbnail).");
      toastError("Please upload the 1st image (it's used as the thumbnail).");
      return;
    }

    const sizesValid = validateSizes();
    if (sizesValid === "duplicate") {
      setError("Each size needs a unique SKU.");
      toastError("Each size needs a unique SKU.");
      return;
    }
    if (!sizesValid) {
      setError("Please fill in weight, price, stock, and SKU for every size.");
      toastError("Please fill in weight, price, stock, and SKU for every size.");
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

  // Irreversible, unlike the Deactivate toggle below — so it asks for the
  // product's name to be typed back rather than a single OK click. Past
  // orders keep their own snapshot of the item and are unaffected; the
  // server also pulls the product out of any live carts.
  const handlePermanentDeleteProduct = async (p) => {
    const typed = window.prompt(
      `PERMANENTLY DELETE "${p.name}"?\n\n` +
        `This cannot be undone. The product is removed from the database and from any customer carts. ` +
        `Past orders are not affected.\n\n` +
        `To confirm, type the product name exactly:`
    );
    if (typed === null) return; // cancelled
    if (typed.trim() !== p.name.trim()) {
      toastError("Name didn't match — nothing was deleted.");
      return;
    }

    setError("");
    setMessage("");
    try {
      await api.adminPermanentlyDeleteProduct(token, p._id);
      setMessage(`"${p.name}" permanently deleted.`);
      success("Product permanently deleted.");
      if (editingId === p._id) resetForm();
      loadData();
    } catch (err) {
      setError(err.message);
      toastError(err.message);
    }
  };

  const handleToggleProductActive = async (p) => {
    const action = p.isActive ? "Deactivate" : "Reactivate";
    if (!window.confirm(`${action} the "${p.name}" product?`)) return;
    setError("");
    setMessage("");
    try {
      if (p.isActive) {
        await api.adminDeleteProduct(token, p._id); // soft delete (sets isActive: false)
      } else {
        await api.adminUpdateProduct(token, p._id, { isActive: true });
      }
      setMessage(`Product ${p.isActive ? "deactivated" : "reactivated"}.`);
      success(`Product ${p.isActive ? "deactivated" : "reactivated"}.`);
      if (editingId === p._id) resetForm();
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

      {/* Categories */}
      <div className="card mt-8 p-6">
        <h3 className="text-lg font-bold text-mdn-white">{catEditingId ? "Edit Category" : "Create Category"}</h3>
        <form onSubmit={handleSaveCategory} className="mt-4 grid gap-4 sm:grid-cols-2">
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
          <div className="flex gap-3 sm:col-span-2">
            <button type="submit" disabled={catSaving} className="btn-primary w-full disabled:opacity-50 sm:w-auto">
              {catSaving ? "Saving..." : catEditingId ? "Save Changes" : "Create Category"}
            </button>
            {catEditingId && (
              <button type="button" onClick={cancelEditCategory} className="btn-secondary w-full sm:w-auto">
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {categories.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[480px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-mdn-charcoal2 text-left text-xs uppercase tracking-wide text-mdn-gray">
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className={`border-b border-white/5 ${!c.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 text-mdn-white">{c.name}</td>
                    <td className="px-4 py-3 text-mdn-gray">{c.slug}</td>
                    <td className="px-4 py-3 text-mdn-gray">{c.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => startEditCategory(c)} className="btn-secondary !px-3 !py-1 text-xs">
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleCategoryActive(c)}
                          className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                            c.isActive
                              ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                              : "border-mdn-green/40 bg-mdn-green/10 text-mdn-green hover:bg-mdn-green/20"
                          }`}
                        >
                          {c.isActive ? "Deactivate" : "Reactivate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              {categories
                .filter((c) => c.isActive || c._id === form.category)
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                    {!c.isActive ? " (inactive)" : ""}
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
            <label className="mb-2 block text-sm font-medium text-mdn-white">
              Tags <span className="text-mdn-gray">(comma-separated — used for search, e.g. the "Peanut Butter" or "Vegan Protein" links in the Shop menu only find products tagged this way)</span>
            </label>
            <input
              name="tags"
              placeholder="e.g. peanut butter, vegan, high-protein"
              value={form.tags}
              onChange={handleFormChange}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">
              Product images <span className="text-mdn-gray">(shown as a swipeable carousel on the product page — the 1st image is also used as the thumbnail on listing cards)</span>
            </label>
            <div className="mt-2 flex flex-wrap gap-4">
              {GALLERY_SLOT_LABELS.map((label, i) => {
                const url = form.images[i] || "";
                return (
                  <div key={i} className="flex w-24 flex-col items-center gap-1.5 text-center">
                    <span className="text-[11px] font-semibold text-mdn-gray">{label}</span>
                    <div className="relative h-20 w-20">
                      {url ? (
                        <img src={url} alt={label} className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                      ) : (
                        <div
                          className={`flex h-20 w-20 items-center justify-center rounded-lg border border-dashed text-[10px] text-mdn-gray ${
                            i === 0 && thumbnailMissing ? "border-red-500/70" : "border-white/20"
                          }`}
                        >
                          Empty
                        </div>
                      )}
                      {uploadingSlot === i && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-[10px] text-white">
                          Uploading...
                        </div>
                      )}
                      {url && uploadingSlot !== i && (
                        <button
                          type="button"
                          onClick={() => removeGallerySlot(i)}
                          className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                          aria-label={`Remove ${label}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleGallerySlotUpload(i, e)}
                      className="w-24 text-[10px] file:mr-1 file:rounded file:border-0 file:bg-mdn-charcoal2 file:px-1.5 file:py-1 file:text-[10px] file:font-semibold file:text-mdn-white"
                    />
                  </div>
                );
              })}
            </div>
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

          {/* ---------- Sizes (independent of flavor) ---------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-mdn-white">
                Sizes <span className="text-red-400">*</span>
              </label>
              <span className="text-xs text-mdn-gray">
                {form.sizes.length} size{form.sizes.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mdn-gray/70">
              Add one entry per pack size customers can choose from (e.g. "500g" and "1kg"). Price, stock, and SKU
              are set here — flavor is a separate, independent choice below and never changes which sizes are
              available.
            </p>

            <div className="mt-3 space-y-4">
              {form.sizes.map((s, i) => (
                <div key={i} className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-mdn-gray">
                      Size {i + 1}
                    </span>
                    {form.sizes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSize(i)}
                        className="text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    name="weight"
                    placeholder="Weight (e.g. 1kg)"
                    value={s.weight}
                    onChange={(e) => handleSizeChange(i, e)}
                    required
                    className={`${sizeFieldClass(i, "weight")} mt-3 w-full`}
                  />
                  {sizeErrors[i]?.weight && <p className="mt-1 text-xs text-red-400">Weight is required.</p>}

                  <div className="mt-4 grid gap-4 sm:grid-cols-3">
                    <div>
                      <input
                        name="price"
                        type="number"
                        placeholder="Price"
                        value={s.price}
                        onChange={(e) => handleSizeChange(i, e)}
                        required
                        className={sizeFieldClass(i, "price")}
                      />
                      {sizeErrors[i]?.price && <p className="mt-1 text-xs text-red-400">Price is required.</p>}
                    </div>
                    <input
                      name="discountPrice"
                      type="number"
                      placeholder="Discount price (optional)"
                      value={s.discountPrice}
                      onChange={(e) => handleSizeChange(i, e)}
                      className="input-field"
                    />
                    <div>
                      <input
                        name="stock"
                        type="number"
                        placeholder="Stock (admin only)"
                        value={s.stock}
                        onChange={(e) => handleSizeChange(i, e)}
                        required
                        className={sizeFieldClass(i, "stock")}
                      />
                      {sizeErrors[i]?.stock && <p className="mt-1 text-xs text-red-400">Stock is required.</p>}
                    </div>
                  </div>

                  <input
                    name="sku"
                    placeholder="SKU (unique code)"
                    value={s.sku}
                    onChange={(e) => handleSizeChange(i, e)}
                    required
                    className={`${sizeFieldClass(i, "sku")} mt-4 w-full`}
                  />
                  {sizeErrors[i]?.sku && (
                    <p className="mt-1 text-xs text-red-400">
                      {!s.sku ? "SKU is required." : "This SKU is used by another size — SKUs must be unique."}
                    </p>
                  )}

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      name="servings"
                      type="number"
                      placeholder="Servings (optional)"
                      value={s.servings}
                      onChange={(e) => handleSizeChange(i, e)}
                      className="input-field"
                    />
                    <input
                      name="supplyLabel"
                      placeholder="Supply label (e.g. 2-month supply)"
                      value={s.supplyLabel}
                      onChange={(e) => handleSizeChange(i, e)}
                      className="input-field"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addSize}
              className="btn-secondary mt-3 !px-4 !py-1.5 text-sm"
            >
              + Add Another Size
            </button>
          </div>

          {/* ---------- Flavors (independent of size, optional) ---------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-mdn-white">Flavors</label>
              <span className="text-xs text-mdn-gray">
                {form.flavors.length} flavor{form.flavors.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mdn-gray/70">
              Optional. Leave empty if this product has no flavor options. Each flavor's price adjustment is set
              once here and applies on top of whichever size the customer picks — e.g. size price ₹500 + ₹50 for
              Chocolate = ₹550.
            </p>

            <div className="mt-3 space-y-4">
              {form.flavors.map((f, i) => (
                <div key={i} className="rounded-lg border border-white/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-mdn-gray">
                      Flavor {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFlavor(i)}
                      className="text-xs font-semibold text-red-400 transition-colors hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    name="name"
                    placeholder="Flavor name (e.g. Chocolate)"
                    value={f.name}
                    onChange={(e) => handleFlavorChange(i, e)}
                    className="input-field mt-3 w-full"
                  />

                  <div className="mt-4">
                    <label className="mb-1 block text-xs text-mdn-gray">
                      Price adjustment (optional) — added to (or subtracted from, if negative) whichever size's
                      price is currently selected
                    </label>
                    <input
                      name="priceAdjustment"
                      type="number"
                      placeholder="e.g. 50, or -20 (leave blank or 0 for no change)"
                      value={f.priceAdjustment}
                      onChange={(e) => handleFlavorChange(i, e)}
                      className="input-field w-full sm:w-1/3"
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-1 block text-xs text-mdn-gray">Flavor swatch photo</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFlavorImageUpload(i, e)}
                        className="input-field w-full sm:w-auto"
                      />
                      {f.image && (
                        <img src={f.image} alt="Flavor preview" className="h-12 w-12 shrink-0 rounded-lg border border-white/10 object-cover" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addFlavor}
              className="btn-secondary mt-3 !px-4 !py-1.5 text-sm"
            >
              + Add Another Flavor
            </button>
          </div>

          {/* ---------- Nutrition highlights (PDP stat cards) ---------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-mdn-white">Nutrition highlights</label>
              <span className="text-xs text-mdn-gray">
                {form.nutritionHighlights.length} stat{form.nutritionHighlights.length === 1 ? "" : "s"}
              </span>
            </div>
            <p className="mt-1 text-xs text-mdn-gray/70">
              Optional. Shown as a row of small cards above the size picker on the product page — e.g. Kcal /
              116, Protein / 27Gms, Carbs / 1.3G, BCAAs / 5.75, Protein % / 82%. Include the unit in the value
              so it reads exactly as you type it. Rows left half-filled are ignored.
            </p>

            <div className="mt-3 space-y-3">
              {form.nutritionHighlights.map((h, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-lg border border-white/10 p-3 sm:flex-row sm:items-center">
                  <input
                    name="label"
                    placeholder="Label (e.g. Protein)"
                    value={h.label}
                    onChange={(e) => handleHighlightChange(i, e)}
                    className="input-field w-full sm:flex-1"
                  />
                  <input
                    name="value"
                    placeholder="Value (e.g. 27Gms)"
                    value={h.value}
                    onChange={(e) => handleHighlightChange(i, e)}
                    className="input-field w-full sm:flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => removeHighlight(i)}
                    className="shrink-0 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 sm:px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addHighlight}
              className="btn-secondary mt-3 !px-4 !py-1.5 text-sm"
            >
              + Add Nutrition Stat
            </button>
          </div>

          {/* ---------- Benefits (PDP icon + claim strip) ---------- */}
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-mdn-white">Key benefits</label>
              <span className="text-xs text-mdn-gray">
                {form.benefits.length} / {MAX_BENEFITS}
              </span>
            </div>
            <p className="mt-1 text-xs text-mdn-gray/70">
              Optional, up to {MAX_BENEFITS}. Shown as an icon + claim strip at the bottom of the product page,
              under the info accordion — e.g. "Fast-absorbing for quick recovery", "Supports lean muscle
              growth". It's a single {MAX_BENEFITS}-column row on desktop, which is why it caps at{" "}
              {MAX_BENEFITS}. Leave the icon on "Auto" to have them cycle.
            </p>

            <div className="mt-3 space-y-3">
              {form.benefits.map((b, i) => (
                <div key={i} className="flex flex-col gap-3 rounded-lg border border-white/10 p-3 sm:flex-row sm:items-center">
                  <input
                    name="text"
                    placeholder="Benefit (e.g. Fast-absorbing for quick recovery)"
                    value={b.text}
                    onChange={(e) => handleBenefitChange(i, e)}
                    className="input-field w-full sm:flex-1"
                  />
                  <select
                    name="icon"
                    value={b.icon}
                    onChange={(e) => handleBenefitChange(i, e)}
                    className="input-field w-full sm:w-40"
                  >
                    <option value="">Auto icon</option>
                    {BENEFIT_ICON_KEYS.map((k) => (
                      <option key={k} value={k}>
                        {BENEFIT_ICONS[k].label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeBenefit(i)}
                    className="shrink-0 text-xs font-semibold text-red-400 transition-colors hover:text-red-300 sm:px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addBenefit}
              disabled={form.benefits.length >= MAX_BENEFITS}
              className="btn-secondary mt-3 !px-4 !py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40"
            >
              {form.benefits.length >= MAX_BENEFITS ? `Limit reached (${MAX_BENEFITS})` : "+ Add Benefit"}
            </button>
          </div>

          {/* ---------- Dietary tags (shown publicly on the PDP) ---------- */}
          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Dietary tags</label>
            <p className="mb-2 text-xs text-amber-400/80">
              These publish as claims on the product page. Vegan and Gluten Free in particular are read as
              allergen/dietary guarantees — only tick what you can stand behind for this exact formulation.
              Leave all unticked to show nothing.
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(DIET_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-mdn-gray">
                  <input
                    type="checkbox"
                    checked={form.dietaryTags.includes(key)}
                    onChange={() => toggleInArray("dietaryTags", key)}
                    className="h-4 w-4 accent-mdn-green"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* ---------- Training goals (shown publicly on the PDP) ---------- */}
          <div>
            <label className="mb-2 block text-sm font-medium text-mdn-white">Training goals</label>
            <p className="mb-2 text-xs text-mdn-gray/70">
              Shown as pills beside the dietary tags on the product page. Leave all unticked to show nothing.
            </p>
            <div className="flex flex-wrap gap-4">
              {Object.entries(GOAL_LABELS).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-mdn-gray">
                  <input
                    type="checkbox"
                    checked={form.goal.includes(key)}
                    onChange={() => toggleInArray("goal", key)}
                    className="h-4 w-4 accent-mdn-green"
                  />
                  {label}
                </label>
              ))}
            </div>
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
                <th className="px-4 py-3">Sizes</th>
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
                    {p.sizes?.length || 0} size{(p.sizes?.length || 0) === 1 ? "" : "s"}
                    {p.flavors?.length > 0 && `, ${p.flavors.length} flavor${p.flavors.length === 1 ? "" : "s"}`}
                    {p.sizes?.length > 0 && (
                      <span className="block text-xs text-mdn-gray/70">
                        Total stock: {p.sizes.reduce((sum, s) => sum + (s.stock || 0), 0)}
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
                        onClick={() => handleToggleProductActive(p)}
                        className={`rounded-md border px-3 py-1 text-xs font-semibold transition-colors ${
                          p.isActive
                            ? "border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                            : "border-mdn-green/40 bg-mdn-green/10 text-mdn-green hover:bg-mdn-green/20"
                        }`}
                      >
                        {p.isActive ? "Deactivate" : "Reactivate"}
                      </button>
                      {/* Visually distinct from Deactivate (solid red, not
                          tinted) because it destroys the record rather than
                          hiding it. */}
                      <button
                        onClick={() => handlePermanentDeleteProduct(p)}
                        title="Permanently delete this product — cannot be undone"
                        className="rounded-md border border-red-600 bg-red-600/90 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-red-600"
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