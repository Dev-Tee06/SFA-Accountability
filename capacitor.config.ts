import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sfa.accountability",
  appName: "SFA Accountability",
  webDir: "out", // Next.js static export directory, though we will use live URL for SSR
  server: {
    // Replace this with your actual production URL when releasing.
    // We use localhost/10.0.2.2 here for Android Emulator testing initially
    url: "https://sons-formation-accountability.vercel.app/",
    cleartext: true,
  },
};

export default config;
