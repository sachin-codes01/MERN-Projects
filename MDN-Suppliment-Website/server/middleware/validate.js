// Har route ke input ko zod schema se check karta hai — body, query aur params.
//
//   router.post("/items", validate({ body: addItemSchema }), ctrl.addItem)
//
// Pass hone par req.body / req.query / req.params ki jagah PARSED data rakh
// diya jata hai: trim, lowercase, number me convert, HTML strip — sab ho
// chuka hota hai, aur schema `.strict()` hone se anjaan fields wahin reject.
// Controller ko sirf saaf, whitelisted data milta hai.
//
// Fail hone par hamesha ek hi shape:
//   400 { success: false, message, errors: [{ field, message }] }
// `message` pehli galti hai — client (api.js) sirf yahi dikhata hai.

const PARTS = ["params", "query", "body"];

const toErrors = (issues, part) =>
  issues.map((issue) => {
    // Strict object ki anjaan key: path khaali hota hai, key `keys` me
    const field = issue.code === "unrecognized_keys" ? issue.keys.join(", ") : issue.path.join(".") || part;
    const message =
      issue.code === "unrecognized_keys" ? `Unknown field${issue.keys.length > 1 ? "s" : ""}: ${field}` : issue.message;
    return { field, message };
  });

const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const part of PARTS) {
    const schema = schemas[part];
    if (!schema) continue;

    const result = schema.safeParse(req[part] ?? {});
    if (!result.success) {
      errors.push(...toErrors(result.error.issues, part));
      continue;
    }

    // Express 5 me req.query sirf getter hai — seedha assign nahi hota,
    // isliye property hi naye (parsed) object se redefine karte hain.
    if (part === "query") {
      Object.defineProperty(req, "query", { value: result.data, writable: true, configurable: true, enumerable: true });
    } else {
      req[part] = result.data;
    }
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors[0].message, errors });
  }
  next();
};

module.exports = validate;
