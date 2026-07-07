import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { createElement } from "react";
import {
  OverviewTemplate,
  type OverviewTemplateProps,
} from "./templates/overview";

/** テンプレートをHTML文字列にする */
export async function renderOverviewHtml(
  props: OverviewTemplateProps
): Promise<string> {
  // react-dom/server はRSCバンドルで静的importできないため動的importする
  const { renderToString } = await import("react-dom/server");
  return "<!DOCTYPE html>" + renderToString(createElement(OverviewTemplate, props));
}

const WINDOWS_CHROME_PATHS = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const MAC_CHROME_PATH =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

interface LaunchConfig {
  executablePath: string;
  args: string[];
}

/**
 * 実行環境ごとのChromium。
 * Vercel（Linux）は @sparticuz/chromium、ローカルはインストール済みブラウザ。
 */
async function resolveChromium(): Promise<LaunchConfig> {
  if (process.env.CHROME_EXECUTABLE_PATH) {
    return { executablePath: process.env.CHROME_EXECUTABLE_PATH, args: [] };
  }
  if (process.platform === "linux") {
    // serverExternalPackages 指定済み。トレースすると全ファイル走査になるため無効化
    const chromium = (await import(/* turbopackIgnore: true */ "@sparticuz/chromium"))
      .default;
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
    };
  }
  const candidates =
    process.platform === "win32" ? WINDOWS_CHROME_PATHS : [MAC_CHROME_PATH];
  for (const p of candidates) {
    // ローカル開発時のブラウザ探索。ビルド時のファイルトレース対象にしない
    if (existsSync(/* turbopackIgnore: true */ p)) {
      return { executablePath: p, args: [] };
    }
  }
  throw new Error(
    "Chromeが見つかりません。環境変数 CHROME_EXECUTABLE_PATH を設定してください。"
  );
}

/** HTMLをA4縦のPDFにする */
export async function htmlToPdf(html: string): Promise<Buffer> {
  const { executablePath, args } = await resolveChromium();
  const browser = await puppeteer.launch({
    executablePath,
    args,
    headless: true,
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load", timeout: 30_000 });
    // Webフォント（Noto Sans JP）の読み込み完了を待ってから印刷する
    await page.evaluateHandle("document.fonts.ready");
    const pdf = await page.pdf({
      format: "a4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
