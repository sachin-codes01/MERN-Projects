// Har error ka ek hi JSON shape: { success: false, message, errors? }.
// Production me 500 wale errors ka asli text (Mongo errors, stack) client
// tak nahi jata — sirf server log me.

const isProd = () => process.env.NODE_ENV === "production";
const GENERIC_500 = "Something went wrong on our side. Please try again.";

// Kai controllers apne catch me `res.status(500).json({ message: err.message })`
// karte hain. Har jagah badalne ki jagah, response nikalne se pehle hi
// production me 5xx ka message generic kar diya jata hai.
const hideServerErrorDetails = (req, res, next) => {
  const json = res.json.bind(res);
  res.json = (body) => {
    if (isProd() && res.statusCode >= 500 && body && typeof body === "object" && body.success === false) {
      if (body.message && body.message !== GENERIC_500) console.error(`[${req.method} ${req.originalUrl}]`, body.message);
      return json({ success: false, message: GENERIC_500 });
    }
    return json(body);
  };
  next();
};

const notFound = (req, res) => res.status(404).json({ success: false, message: "Route not found" });

// Express ise 4 arguments se pehchanta hai — aakhri me register hona chahiye.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let status = err.status || err.statusCode || 500;
  let message = err.message || "Internal server error";
  let errors;

  if (err.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON in request body";
  } else if (err.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  } else if (err.name === "MulterError") {
    status = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large (max 5 MB)"
        : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "Upload one image at a time"
          : "Image upload failed";
  } else if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path || "value"}`;
  } else if (err.name === "ValidationError" && err.errors) {
    // Mongoose schema validation — aakhri line of defence
    status = 400;
    errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = errors[0]?.message || "Validation failed";
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0];
    message = field ? `That ${field} is already in use` : "Duplicate value";
  }

  if (status >= 500) {
    console.error(err);
    if (isProd()) message = GENERIC_500;
  }

  res.status(status).json({ success: false, message, ...(errors ? { errors } : {}) });
};

module.exports = { hideServerErrorDetails, notFound, errorHandler };
