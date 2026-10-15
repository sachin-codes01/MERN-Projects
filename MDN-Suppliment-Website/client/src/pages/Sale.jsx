import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/api";
import ProductCard from "../components/ProductCard";
import SaleBadge from "../components/SaleBadge";
import Reveal from "../components/motion/Reveal";

// Sale page — admin panel me jin products pe "sale badge" laga hai, woh sab.
export default function Sale() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getProducts({ onSale: "true", limit: 100 })
      .then((d) => setProducts(d.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="section">
      <div className="flex items-center gap-4">
        <SaleBadge text="SALE" size={64} className="shrink-0" />
        <div>
          <p className="eyebrow">Limited time</p>
          <h1 className="display-xl mt-1">
            On <span className="display-accent">Sale</span>
          </h1>
          <p className="mt-1 text-sm text-mdn-ink-muted sm:text-base">Our best prices right now — while stock lasts.</p>
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-mdn-charcoal2" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-8 text-sm text-mdn-danger">{error}</p>
      ) : products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-mdn-border bg-mdn-charcoal p-8 text-center">
          <p className="font-heading text-lg font-bold text-mdn-ink">No sale on right now</p>
          <p className="mt-1 text-sm text-mdn-ink-muted">Check back soon — or browse the full range.</p>
          <Link to="/products" className="btn-primary mt-5 inline-flex">
            Shop all products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((p, i) => (
            <Reveal key={p._id} from="up" delay={(i % 5) * 0.05} amount={0.15} className="h-full">
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
