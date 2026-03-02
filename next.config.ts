import type { NextConfig } from "next";
import nextPwa from "next-pwa";

const withPWA = nextPwa({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
    // 기존 config 옵션이 있으면 여기에 추가
};

// @ts-ignore
export default withPWA(nextConfig);