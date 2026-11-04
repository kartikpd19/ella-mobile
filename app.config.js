// Extends app.json. EXPO_BASE_URL serves the web build from a subpath
// (GitHub Pages: /ella-mobile); unset, the app is served from the root as before.
module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
