import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { getProductName, getSubSkuFamily } from "../../utils/productUtils";

const WTBPanel = () => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);

  const fetchSkus = async (searchValue = search) => {
    try {
      setLoading(true);
      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      const res = await axios.post(
        `${baseUrl}/api/customer/get-product-list`,
        {
          page: 1,
          limit: 100,
          search: searchValue || undefined,
          forWTB: true, // Request unique SKU families and sub-SKU families
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: localStorage.getItem("token")
              ? `Bearer ${localStorage.getItem("token")}`
              : "",
          },
        }
      );
      const docs = res.data?.data?.docs || [];
      
      // For WTB mode, API returns simplified structure with phoneName and brand already set
      setRows(
        docs.map((p) => {
          return {
            id: p._id || p.skuFamilyId || p.subSkuFamilyId, // Use first available ID
            phoneName: p.phoneName || 'Product',
            brand: p.brand || '-',
            brandId: p.brandId || null,
            skuFamilyId: p.skuFamilyId || null,
            subSkuFamilyId: p.subSkuFamilyId || null,
          };
        })
      );
    } catch (e) {
      console.error("WTB fetch error", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchSkus();
    }
  }, [open]);

  const handleSearch = async (e) => {
    e.preventDefault();
    await fetchSkus(search);
  };

  const handleSubmitWtb = async (row) => {
    const { value: qty } = await Swal.fire({
      title: "Enter quantity",
      input: "number",
      inputAttributes: { min: 1 },
      inputValue: 1,
      showCancelButton: true,
      confirmButtonText: "Submit",
    });

    if (!qty || Number(qty) <= 0) return;

    try {
      const token = localStorage.getItem("token");
      const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!token || !isLoggedIn) {
        const returnTo = encodeURIComponent(
          window.location.hash?.slice(1) || "/home"
        );
        window.location.href = `/#/login?returnTo=${returnTo}`;
        return;
      }

      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:3200";
      await axios.post(
        `${baseUrl}/api/customer/wtb/create`,
        {
          productId: row.id,
          quantity: Number(qty),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await Swal.fire({
        icon: "success",
        title: "Request submitted",
        text: "Your WTB request has been submitted.",
      });
    } catch (err) {
      console.error("WTB submit error", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Failed to submit request",
      });
    }
  };

  if (!open) {
    return (
      <button
        className="fixed bottom-4 right-4 z-40 px-4 py-3 rounded-full shadow-lg bg-[#0071E0] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#005bb5]"
        onClick={() => setOpen(true)}
      >
        WTB
      </button>
    );
  }

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 px-4 py-3 rounded-full shadow-lg bg-gray-700 text-white text-sm font-semibold flex items-center gap-2 hover:bg-gray-800"
        onClick={() => setOpen(false)}
      >
        Close WTB
      </button>

      <div className="fixed inset-0 z-30 bg-black/40 flex items-end md:items-center justify-center">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-5xl max-h-[80vh] flex flex-col overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Want To Buy (WTB)</h2>
            <button
              onClick={() => setOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600 text-lg" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="p-4 border-b flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 text-sm"
              placeholder="Search phone name or brand…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#0071E0] text-white rounded-lg text-sm font-semibold"
            >
              Search
            </button>
          </form>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : rows.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No SKUs found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left">Phone Name</th>
                    <th className="px-3 py-2 text-left">Brand</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{r.phoneName}</td>
                      <td className="px-3 py-2">{r.brand || "-"}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          type="button"
                          className="px-3 py-1.5 rounded-full bg-[#0071E0] text-white text-xs font-semibold hover:bg-[#005bb5]"
                          onClick={() => handleSubmitWtb(r)}
                        >
                          Submit WTB
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default WTBPanel;



