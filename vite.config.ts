import { reactRouter } from "@react-router/dev/vite";
import {
  sentryReactRouter,
  type SentryReactRouterBuildOptions,
} from "@sentry/react-router";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const sentryConfig: SentryReactRouterBuildOptions = {
  org: "jsmastry-4e",
  project: "travel_agency",
  // An auth token is required for uploading source maps;
  // store it in an environment variable to keep it secure.
  authToken:
    "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",
  // ...
};
// export default defineConfig({
//   plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
//   ssr: {
//     noExternal: [/@syncfusion/],
//   },
// });

export default defineConfig((config) => {
  return {
    plugins: [
      tailwindcss(),
      reactRouter(),
      sentryReactRouter(sentryConfig, config),
      tsconfigPaths(),
    ],
    ssr: {
      noExternal: [/@syncfusion/],
    },
  };
});
