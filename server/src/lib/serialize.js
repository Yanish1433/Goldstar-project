/** Response shapes of SPEC §3.2 that are not plain `doc.toJSON()`. */

const iso = (d) => (d instanceof Date ? d.toISOString() : d);

export function productSummary(doc) {
  const p = typeof doc.toJSON === 'function' ? doc.toJSON() : doc;
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    series: p.series ?? null,
    categories: p.categories,
    featured: p.featured,
    priceFrom: p.priceFrom,
    priceTo: p.priceTo,
    colourways: p.colourways.map((c) => ({
      key: c.key,
      name: c.name,
      hex: c.hex,
      price: c.price,
      regularPrice: c.regularPrice,
      inStock: c.inStock,
      image: c.images?.[0] ?? null,
      secondImage: c.images?.[1] ?? null,
    })),
  };
}

export function orderToJSON(order, { admin = false } = {}) {
  const o = order.toJSON();
  const out = {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    items: o.items.map((i) => ({
      productId: i.product ? String(i.product) : null,
      slug: i.slug,
      name: i.name,
      colourwayKey: i.colourwayKey,
      colourwayName: i.colourwayName,
      size: i.size,
      qty: i.qty,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      image: i.image ?? null,
    })),
    subtotal: o.subtotal,
    deliveryFee: o.deliveryFee,
    total: o.total,
    currency: o.currency,
    shipping: {
      fullName: o.shipping.fullName,
      phone: o.shipping.phone,
      addressLine: o.shipping.addressLine,
      area: o.shipping.area,
      city: o.shipping.city,
      landmark: o.shipping.landmark ?? null,
      notes: o.shipping.notes ?? null,
    },
    statusHistory: o.statusHistory.map((h) => ({ status: h.status, at: iso(h.at), note: h.note ?? null })),
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
  if (admin) {
    const u = order.populated('user') ? order.user : null;
    out.customer = u && u.email ? { id: String(u._id), name: u.name, email: u.email } : null;
  }
  return out;
}

export function orderSummary(order) {
  const o = order.toJSON();
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: o.total,
    itemCount: o.items.reduce((n, i) => n + i.qty, 0),
    createdAt: o.createdAt,
    firstImage: o.items[0]?.image ?? null,
  };
}

export function page(items, pageNo, limit, total) {
  return { items, page: pageNo, limit, total };
}
